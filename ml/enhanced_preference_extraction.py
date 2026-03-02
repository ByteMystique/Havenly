"""
Enhanced Hostel Preference Extraction Model
============================================
Extracts user preferences from natural language text.

Features:
- Natural language understanding
- Fuzzy matching for better recognition
- Synonym handling
- Context-aware extraction
- Validation and error handling
- Rent range support ("between X and Y", "X to Y", "at least X")
- Fixed 'k' notation (only replaces digit+k, e.g. 5k -> 5000)
- No dependencies on ML libraries

Usage:
    python enhanced_preference_extraction.py

Or import:
    from enhanced_preference_extraction import EnhancedPreferenceExtractor
"""

import re
from typing import Dict, Optional, List, Tuple


class EnhancedPreferenceExtractor:
    """
    Enhanced preference extraction with NLP capabilities
    """
    
    def __init__(self):
        """Initialize with default preferences and keyword mappings"""
        
        # Default preferences (fallback values)
        self.default_prefs = {
            'Distance_from_CUSAT_km': 3.0,
            'Estimated_Monthly_Rent': 5000.0,
            'Safety_Score': 7.0,
            'Rating': 4.0,
            'Food_Quality_Score': 6.0,
            'WiFi_Available': 1,
            'Food_Available': 1,
            'CCTV_Security': 1
        }
        
        # Expanded keyword mappings for better recognition
        self.distance_keywords = [
            'distance', 'km', 'kilometer', 'far', 'near', 'close', 
            'proximity', 'away', 'walking distance', 'commute'
        ]
        
        self.rent_keywords = [
            'rent', 'budget', 'price', 'cost', 'monthly', 'per month',
            'affordable', 'cheap', 'expensive', 'payment', 'fee'
        ]
        
        self.safety_keywords = [
            'safety', 'safe', 'secure', 'security', 'protection',
            'dangerous', 'risky', 'unsafe'
        ]
        
        self.rating_keywords = [
            'rating', 'rated', 'stars', 'review', 'reviews',
            'google rating', 'score', 'reputation'
        ]
        
        self.food_keywords = [
            'food', 'meal', 'mess', 'dining', 'breakfast',
            'lunch', 'dinner', 'cuisine', 'cooking'
        ]
        
        # Amenity keywords with synonyms
        self.amenity_keywords = {
            'WiFi_Available': [
                'wifi', 'wi-fi', 'internet', 'broadband', 'connection',
                'online', 'network', 'wireless'
            ],
            'Food_Available': [
                'food', 'mess', 'meal', 'dining', 'cafeteria',
                'kitchen', 'cooking', 'breakfast', 'lunch', 'dinner'
            ],
            'CCTV_Security': [
                'cctv', 'camera', 'surveillance', 'security camera',
                'monitoring', 'video surveillance'
            ]
        }
        
        # Intensity modifiers
        self.high_intensity = ['very', 'extremely', 'highly', 'really', 'super', 'must']
        self.low_intensity = ['somewhat', 'fairly', 'moderately', 'reasonably']

        # Gender / hostel-type keyword maps
        self.gents_keywords = [
            'mens', "men's", 'men', 'boys', "boy's", 'gents', 'gent',
            'male', 'males', 'man', 'gentleman', 'gentlemen'
        ]
        self.ladies_keywords = [
            'womens', "women's", 'women', 'girls', "girl's", 'ladies',
            'lady', 'female', 'females', 'woman', 'she'
        ]
        self.mixed_keywords = [
            'mixed', 'coed', 'co-ed', 'co ed', 'any type', 'any gender'
        ]
        
    def preprocess(self, text: str) -> str:
        """Clean and normalize input text"""
        # Convert to lowercase
        text = text.lower()

        # Remove currency symbols and normalize units via simple replacements
        simple_replacements = [
            ('₹', ''),
            ('rs.', ''),
            ('rupees', ''),
            ('kilometers', 'km'),
            ('kilometer', 'km'),
            ('kms', 'km'),
            ('metres', 'm'),
            ('meters', 'm'),
        ]
        for old, new in simple_replacements:
            text = text.replace(old, new)

        # FIX: only expand 'k' when immediately preceded by a digit (e.g. 5k -> 5000)
        # Previously 'k': '000' was applied globally, corrupting words like 'okay', 'km', etc.
        text = re.sub(r'(\d+)[kK]\b', lambda m: str(int(m.group(1)) * 1000), text)

        # Normalize whitespace
        text = ' '.join(text.split())

        return text
    
    def extract_distance(self, text: str) -> Optional[float]:
        """Extract distance preference from text"""
        # Pattern for explicit distance
        patterns = [
            r'(within|under|less than|max|maximum|not more than|up to|around)\s*(\d+(?:\.\d+)?)\s*km',
            r'(\d+(?:\.\d+)?)\s*km\s*(or less|maximum|max|away)',
            r'(\d+(?:\.\d+)?)\s*km'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                # Extract the number (could be in different groups)
                numbers = [g for g in match.groups() if g and g.replace('.', '').isdigit()]
                if numbers:
                    return float(numbers[0])
        
        # Handle qualitative descriptions
        if any(phrase in text for phrase in ['very near', 'walking distance', 'very close']):
            return 1.0
        if any(phrase in text for phrase in ['near cusat', 'close to cusat', 'nearby']):
            return 2.0
        if 'far' in text or 'distant' in text:
            return 5.0
            
        return None
    
    def extract_rent(self, text: str) -> Optional[float]:
        """Extract rent/budget upper-bound preference from text"""
        if not any(kw in text for kw in self.rent_keywords):
            return None

        # Patterns for upper-bound / single-value rent
        patterns = [
            r'(?:under|below|less than|max(?:imum)?|budget|around|approximately)\s*(\d{3,6})',
            r'(\d{3,6})\s*(?:rupees|per month|monthly|budget|rent)',
            r'budget\s*(\d{3,6})',
            r'(\d{3,6})'
        ]

        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                numbers = [g for g in match.groups() if g and g.isdigit()]
                if numbers:
                    value = float(numbers[0])
                    if value < 100:  # Likely already-multiplied k value missed
                        value *= 1000
                    return value

        # Qualitative fallback
        if 'cheap' in text or 'affordable' in text or 'low budget' in text:
            return 3000.0
        if 'expensive' in text or 'high budget' in text or 'premium' in text:
            return 8000.0

        return None

    def extract_rent_range(self, text: str) -> Optional[Tuple[float, float]]:
        """
        Extract rent range from text.
        Handles patterns like:
          - "between 3000 and 5000"
          - "3000 to 5000"
          - "at least 3000" (returns (3000, inf))
          - "minimum 3000" (returns (3000, inf))
        Returns a (min, max) tuple, or None if no range found.
        """
        range_patterns = [
            # "between X and Y" / "X and Y"
            r'between\s*(\d{3,6})\s*(?:and|to|-)\s*(\d{3,6})',
            # "X to Y" / "X - Y"
            r'(\d{3,6})\s*(?:to|-)\s*(\d{3,6})'
        ]
        for pattern in range_patterns:
            match = re.search(pattern, text)
            if match:
                lo, hi = float(match.group(1)), float(match.group(2))
                if lo < 100:
                    lo *= 1000
                if hi < 100:
                    hi *= 1000
                return (min(lo, hi), max(lo, hi))

        # Lower-bound only: "at least X" / "minimum X" / "more than X"
        lower_bound_patterns = [
            r'(?:at least|minimum|min|more than|above)\s*(\d{3,6})'
        ]
        for pattern in lower_bound_patterns:
            match = re.search(pattern, text)
            if match:
                lo = float(match.group(1))
                if lo < 100:
                    lo *= 1000
                return (lo, float('inf'))

        return None
    
    def extract_score(self, text: str, keywords: List[str], max_score: float = 10.0) -> Optional[float]:
        """Extract numerical score from text"""
        # Check if any keyword is present
        if not any(kw in text for kw in keywords):
            return None
        
        # Pattern for explicit scores
        for kw in keywords:
            patterns = [
                rf'{kw}\s*(above|over|at least|min|minimum|more than)?\s*(\d+(?:\.\d+)?)',
                rf'(\d+(?:\.\d+)?)\s*{kw}',
                rf'{kw}.*?(\d+(?:\.\d+)?)'
            ]
            
            for pattern in patterns:
                match = re.search(pattern, text)
                if match:
                    # Extract number
                    numbers = [g for g in match.groups() if g and re.match(r'\d+(?:\.\d+)?', g)]
                    if numbers:
                        score = float(numbers[0])
                        # Validate score range
                        if 0 <= score <= max_score:
                            return score
        
        # Handle qualitative descriptions
        if any(kw in text for kw in keywords):
            if any(word in text for word in ['high', 'very', 'excellent', 'great', 'top']):
                return max_score * 0.9  # 90% of max
            if any(word in text for word in ['good', 'decent', 'okay']):
                return max_score * 0.7  # 70% of max
            if any(word in text for word in ['low', 'poor', 'bad']):
                return max_score * 0.3  # 30% of max
                
        return None
    
    def extract_hostel_type(self, text: str) -> Optional[str]:
        """Extract hostel type (Gents / Ladies / Mixed) from text."""
        text_lower = text.lower()

        # Check Mixed first (most specific phrase)
        for kw in self.mixed_keywords:
            if kw in text_lower:
                return 'Mixed'

        # Check Ladies
        for kw in self.ladies_keywords:
            # Use word-boundary matching to avoid false hits
            if re.search(r'\b' + re.escape(kw) + r'\b', text_lower):
                return 'Ladies'

        # Check Gents
        for kw in self.gents_keywords:
            if re.search(r'\b' + re.escape(kw) + r'\b', text_lower):
                return 'Gents'

        return None

    def extract_boolean(self, text: str, feature_name: str) -> Optional[int]:
        """Extract boolean preference (required/not required)"""
        keywords = self.amenity_keywords.get(feature_name, [])
        
        # Check for negative indicators
        negative_patterns = [
            r'(no|without|dont need|don\'t need|not required)\s*(' + '|'.join(keywords) + ')',
            r'(' + '|'.join(keywords) + r')\s*(not required|not needed|optional)'
        ]
        
        for pattern in negative_patterns:
            if re.search(pattern, text):
                return 0
        
        # Check for positive indicators
        positive_patterns = [
            r'(need|want|require|must have|should have|with)\s*(' + '|'.join(keywords) + ')',
            r'(' + '|'.join(keywords) + r')\s*(required|needed|necessary|mandatory|must)',
            r'(' + '|'.join(keywords) + ')'
        ]
        
        for pattern in positive_patterns:
            if re.search(pattern, text):
                # Check intensity
                if any(word in text for word in self.high_intensity):
                    return 1  # Definitely required
                return 1  # Required
        
        return None  # Not mentioned
    
    def extract_preferences(self, text: str) -> Dict[str, float]:
        """Extract all preferences from natural language text"""
        # Preprocess text
        text = self.preprocess(text)

        # Start with defaults
        prefs = self.default_prefs.copy()
        # Note: hostel_type is NOT added here — it is only set when the user explicitly mentions it

        # Extract distance
        distance = self.extract_distance(text)
        if distance is not None:
            prefs['Distance_from_CUSAT_km'] = distance

        # Extract rent — try range first, then upper-bound
        rent_range = self.extract_rent_range(text)
        if rent_range is not None:
            lo, hi = rent_range
            prefs['rent_min'] = lo
            prefs['rent_max'] = hi if hi != float('inf') else None
            # Use midpoint (or lower-bound) as the KNN target value
            prefs['Estimated_Monthly_Rent'] = (lo + hi) / 2 if hi != float('inf') else lo
        else:
            rent = self.extract_rent(text)
            if rent is not None:
                prefs['Estimated_Monthly_Rent'] = rent
                prefs['rent_min'] = None
                prefs['rent_max'] = rent

        # Extract safety score
        safety = self.extract_score(text, self.safety_keywords, max_score=10.0)
        if safety is not None:
            prefs['Safety_Score'] = safety

        # Extract rating
        rating = self.extract_score(text, self.rating_keywords, max_score=5.0)
        if rating is not None:
            prefs['Rating'] = rating

        # Extract food quality
        food_quality = self.extract_score(text, self.food_keywords, max_score=10.0)
        if food_quality is not None:
            prefs['Food_Quality_Score'] = food_quality

        # Extract boolean amenities
        for feature_name in ['WiFi_Available', 'Food_Available', 'CCTV_Security']:
            value = self.extract_boolean(text, feature_name)
            if value is not None:
                prefs[feature_name] = value

        # Extract hostel type (gender filter)
        hostel_type = self.extract_hostel_type(text)
        if hostel_type is not None:
            prefs['hostel_type'] = hostel_type

        return prefs
    
    def validate_preferences(self, prefs: Dict[str, float]) -> Tuple[bool, List[str]]:
        """Validate extracted preferences"""
        warnings = []
        
        # Validate distance
        if prefs['Distance_from_CUSAT_km'] < 0 or prefs['Distance_from_CUSAT_km'] > 20:
            warnings.append(f"Distance {prefs['Distance_from_CUSAT_km']} km seems unusual. Using default.")
            prefs['Distance_from_CUSAT_km'] = self.default_prefs['Distance_from_CUSAT_km']
        
        # Validate rent
        if prefs['Estimated_Monthly_Rent'] < 500 or prefs['Estimated_Monthly_Rent'] > 20000:
            warnings.append(f"Rent Rs.{prefs['Estimated_Monthly_Rent']} seems unusual. Using default.")
            prefs['Estimated_Monthly_Rent'] = self.default_prefs['Estimated_Monthly_Rent']
        
        # Validate scores
        if not (0 <= prefs['Safety_Score'] <= 10):
            warnings.append("Safety score out of range. Using default.")
            prefs['Safety_Score'] = self.default_prefs['Safety_Score']
        
        if not (0 <= prefs['Rating'] <= 5):
            warnings.append("Rating out of range. Using default.")
            prefs['Rating'] = self.default_prefs['Rating']
        
        if not (0 <= prefs['Food_Quality_Score'] <= 10):
            warnings.append("Food quality score out of range. Using default.")
            prefs['Food_Quality_Score'] = self.default_prefs['Food_Quality_Score']
        
        return (len(warnings) == 0, warnings)
    
    def extract_and_validate(self, text: str) -> Tuple[Dict[str, float], List[str]]:
        """
        Extract and validate preferences from text
        
        Parameters:
        -----------
        text : str
            Natural language description of preferences
            
        Returns:
        --------
        tuple : (preferences_dict, list_of_warnings)
        """
        # Extract preferences
        prefs = self.extract_preferences(text)
        
        # Validate
        is_valid, warnings = self.validate_preferences(prefs)
        
        return prefs, warnings


def main():
    """Interactive demo - Extract preferences only"""
    print("="*80)
    print("HOSTEL PREFERENCE EXTRACTION (NLP)")
    print("="*80)
    print("\nDescribe your hostel requirements in natural language.\n")
    print("Examples:")
    print("  - 'I need a hostel within 2 km of CUSAT with WiFi and food under 4000'")
    print("  - 'Looking for a safe place near campus, budget around 5k, must have CCTV'")
    print("  - 'Want a cheap hostel with good food quality and internet'")
    print("  - 'Need walking distance from campus, affordable rent, very safe'")
    print("\n" + "="*80)
    
    # Get user input
    user_text = input("\nYour requirements: ")
    
    # Extract preferences
    extractor = EnhancedPreferenceExtractor()
    
    print("\n" + "="*80)
    print("EXTRACTED PREFERENCES")
    print("="*80)
    
    prefs, warnings = extractor.extract_and_validate(user_text)
    
    # Show warnings if any
    if warnings:
        print("\nWarnings:")
        for warning in warnings:
            print(f"  ⚠ {warning}")
    
    # Display extracted preferences
    print("\n✓ Successfully extracted preferences:")
    print("-" * 80)
    
    print("\nLocation & Budget:")
    print(f"  • Max Distance from CUSAT: {prefs['Distance_from_CUSAT_km']} km")
    print(f"  • Max Monthly Rent: Rs. {prefs['Estimated_Monthly_Rent']:.0f}")
    
    print("\nQuality Scores:")
    print(f"  • Min Safety Score: {prefs['Safety_Score']}/10")
    print(f"  • Min Google Rating: {prefs['Rating']}/5")
    print(f"  • Min Food Quality: {prefs['Food_Quality_Score']}/10")
    
    print("\nRequired Amenities:")
    print(f"  • WiFi: {'Yes' if prefs['WiFi_Available'] else 'No'}")
    print(f"  • Food: {'Yes' if prefs['Food_Available'] else 'No'}")
    print(f"  • CCTV: {'Yes' if prefs['CCTV_Security'] else 'No'}")
    
    print("\n" + "="*80)
    print("✓ Preference extraction complete!")
    print("="*80)
    
    # Show raw dictionary format
    print("\nRaw format (for use in code):")
    print(prefs)


if __name__ == "__main__":
    main()
