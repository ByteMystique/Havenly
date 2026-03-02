"""
KNN-Based Hostel Recommendation System for CUSAT
=================================================
This script implements a K-Nearest Neighbors recommendation system
to help students find suitable hostels near CUSAT based on their preferences.
"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from sklearn.impute import KNNImputer
import warnings
warnings.filterwarnings('ignore')


class HostelRecommender:
    """KNN-based hostel recommendation system"""

    def __init__(self, data_path='CUSAT_Private_Hostels_ML_Updated.xlsx'):
        """
        Initialize the recommender system

        Parameters:
        -----------
        data_path : str
            Path to the Excel file containing hostel data
        """
        self.data_path = data_path
        self.df = None
        self.df_processed = None
        self.scaler = MinMaxScaler()
        self.feature_columns = []
        self.X_scaled = None

        # Default feature weights (can be customized)
        self.weights = {
            'Distance_from_CUSAT_km': 0.25,
            'Estimated_Monthly_Rent': 0.20,
            'Safety_Score': 0.15,
            'Rating': 0.10,
            'Food_Quality_Score': 0.08,
            'WiFi_Available': 0.05,
            'Food_Available': 0.05,
            'AC_Available': 0.03,
            'Parking_Available': 0.03,
            'Laundry_Available': 0.02,
            'CCTV_Security': 0.02,
            'Is_Clean': 0.01,
            'Open_24x7': 0.01
        }

    def load_data(self):
        """Load and perform initial data inspection"""
        print("Loading hostel data...")
        self.df = pd.read_excel(self.data_path)
        print(f"[OK] Loaded {len(self.df)} hostels")
        print(f"[OK] Columns: {list(self.df.columns)}")
        return self.df

    def preprocess_data(self):
        """Preprocess the data: handle missing values, encode features"""
        print("\nPreprocessing data...")
        self.df_processed = self.df.copy()

        # Handle missing values with KNNImputer
        numeric_cols = ['Rating', 'Rating_Count', 'Distance_from_CUSAT_km',
                        'Estimated_Monthly_Rent', 'Safety_Score', 'Food_Quality_Score']
        existing_numeric = [c for c in numeric_cols if c in self.df_processed.columns]
        if existing_numeric:
            imputer = KNNImputer(n_neighbors=5)
            self.df_processed[existing_numeric] = imputer.fit_transform(
                self.df_processed[existing_numeric]
            )
            print(f"[OK] KNNImputer applied to {existing_numeric}")

        # Ensure binary columns are 0 or 1
        binary_cols = ['WiFi_Available', 'Food_Available', 'AC_Available',
                       'Parking_Available', 'Laundry_Available', 'CCTV_Security',
                       'Is_Clean', 'Open_24x7']
        for col in binary_cols:
            if col in self.df_processed.columns:
                self.df_processed[col] = self.df_processed[col].fillna(0).astype(int)

        # Handle Hostel_Type (one-hot encoding)
        if 'Hostel_Type' in self.df_processed.columns:
            # FIX: strip whitespace from Hostel_Type values to avoid filter mismatches
            self.df_processed['Hostel_Type'] = (
                self.df_processed['Hostel_Type'].astype(str).str.strip()
            )
            hostel_type_dummies = pd.get_dummies(self.df_processed['Hostel_Type'],
                                                 prefix='Type', drop_first=True)
            self.df_processed = pd.concat([self.df_processed, hostel_type_dummies], axis=1)

        print("[OK] Data preprocessing complete")
        return self.df_processed

    def prepare_features(self):
        """Prepare and scale features for KNN"""
        print("\nPreparing features...")

        self.feature_columns = [
            'Distance_from_CUSAT_km', 'Rating', 'Rating_Count',
            'Estimated_Monthly_Rent', 'Safety_Score', 'Food_Quality_Score',
            'WiFi_Available', 'Food_Available', 'AC_Available',
            'Parking_Available', 'Laundry_Available', 'CCTV_Security',
            'Is_Clean', 'Open_24x7'
        ]

        # Add hostel type columns if they exist
        type_cols = [col for col in self.df_processed.columns if col.startswith('Type_')]
        self.feature_columns.extend(type_cols)

        # Filter to only existing columns
        self.feature_columns = [col for col in self.feature_columns
                                if col in self.df_processed.columns]

        X = self.df_processed[self.feature_columns].copy()

        # Normalize features to [0, 1] range
        self.X_scaled = pd.DataFrame(
            self.scaler.fit_transform(X),
            columns=self.feature_columns,
            index=X.index
        )

        # Inverse scaling for "lower is better" features
        if 'Distance_from_CUSAT_km' in self.X_scaled.columns:
            self.X_scaled['Distance_from_CUSAT_km'] = 1 - self.X_scaled['Distance_from_CUSAT_km']

        if 'Estimated_Monthly_Rent' in self.X_scaled.columns:
            self.X_scaled['Estimated_Monthly_Rent'] = 1 - self.X_scaled['Estimated_Monthly_Rent']

        print(f"[OK] Prepared {len(self.feature_columns)} features")
        print(f"  Features: {self.feature_columns}")
        return self.X_scaled

    def calculate_weighted_distance(self, user_prefs_scaled):
        """
        Calculate weighted Euclidean distance between user preferences and all hostels

        Parameters:
        -----------
        user_prefs_scaled : pd.Series
            Scaled user preferences

        Returns:
        --------
        pd.Series : Distances for each hostel
        """
        weight_vector = np.array([self.weights.get(col, 0.01) for col in self.feature_columns])
        weight_vector = weight_vector / weight_vector.sum()

        squared_diff = ((self.X_scaled - user_prefs_scaled) ** 2) * weight_vector
        distances = np.sqrt(squared_diff.sum(axis=1))

        return distances

    def get_explanation(self, hostel_row: pd.Series, user_prefs_scaled: pd.Series) -> dict:
        """
        Produce a human-readable explanation for a single recommendation.
        """
        weight_vector = np.array([self.weights.get(col, 0.01) for col in self.feature_columns])
        weight_vector = weight_vector / weight_vector.sum()

        contributions = {}
        for col, w in zip(self.feature_columns, weight_vector):
            diff = abs(self.X_scaled.loc[hostel_row.name, col] - user_prefs_scaled[col])
            contributions[col] = round(float((1 - diff) * w), 4)

        sorted_contrib = sorted(contributions.items(), key=lambda x: x[1], reverse=True)
        top_features = [(col, score) for col, score in sorted_contrib[:3]]
        weak_features = [(col, score) for col, score in contributions.items() if score < 0.5]

        label_map = {
            'Distance_from_CUSAT_km': 'Within distance limit',
            'Estimated_Monthly_Rent': 'Matches your budget',
            'Safety_Score': 'High safety score',
            'Rating': 'Well rated',
            'Food_Quality_Score': 'Good food quality',
            'WiFi_Available': 'Has WiFi',
            'Food_Available': 'Food provided',
            'AC_Available': 'Has AC',
            'Parking_Available': 'Has parking',
            'Laundry_Available': 'Has laundry',
            'CCTV_Security': 'Has CCTV security',
            'Is_Clean': 'Clean facility',
            'Open_24x7': 'Open 24/7',
        }
        return {
            'top_matches': [
                {'feature': label_map.get(col, col), 'score': score}
                for col, score in top_features
            ],
            'shortfalls': [
                {'feature': label_map.get(col, col), 'score': score}
                for col, score in weak_features
            ]
        }

    def recommend(self, user_preferences, k=5, show_details=True):
        """
        Recommend top K hostels based on user preferences

        Parameters:
        -----------
        user_preferences : dict
            Dictionary with user preferences for each feature.
            Optionally include 'hostel_type': 'Gents' | 'Ladies' | 'Mixed'
        k : int
            Number of recommendations to return
        show_details : bool
            Whether to print detailed results

        Returns:
        --------
        pd.DataFrame : Top K recommended hostels with scores
        """
        user_preferences = dict(user_preferences)  # mutable copy

        # --- Hard gender/type filter ---
        hostel_type = user_preferences.pop('hostel_type', None)

        if hostel_type and 'Hostel_Type' in self.df_processed.columns:
            if hostel_type == 'Gents':
                allowed = ['Gents', 'Mixed']
            elif hostel_type == 'Ladies':
                allowed = ['Ladies', 'Mixed']
            else:
                allowed = ['Gents', 'Ladies', 'Mixed']
            valid_mask = self.df_processed['Hostel_Type'].isin(allowed)
        else:
            valid_mask = pd.Series([True] * len(self.df_processed),
                                   index=self.df_processed.index)

        # --- Build user preference vector ---
        user_prefs = pd.Series(user_preferences)

        for col in self.feature_columns:
            if col not in user_prefs.index:
                user_prefs[col] = (
                    self.df_processed[col].median()
                    if col in self.df_processed.columns else 0
                )

        user_prefs = user_prefs[self.feature_columns]

        # Scale user preferences using the same scaler fitted on training data
        user_prefs_array = user_prefs.values.reshape(1, -1)

        # FIX: clip values to scaler's observed min/max to avoid out-of-range warnings
        user_prefs_array = np.clip(
            user_prefs_array,
            self.scaler.data_min_,
            self.scaler.data_max_
        )

        user_prefs_scaled = pd.Series(
            self.scaler.transform(user_prefs_array)[0],
            index=self.feature_columns
        )

        # Inverse scaling for "lower is better" features
        if 'Distance_from_CUSAT_km' in user_prefs_scaled.index:
            user_prefs_scaled['Distance_from_CUSAT_km'] = (
                1 - user_prefs_scaled['Distance_from_CUSAT_km']
            )

        if 'Estimated_Monthly_Rent' in user_prefs_scaled.index:
            user_prefs_scaled['Estimated_Monthly_Rent'] = (
                1 - user_prefs_scaled['Estimated_Monthly_Rent']
            )

        # --- Calculate distances ---
        distances = self.calculate_weighted_distance(user_prefs_scaled)

        results = self.df_processed.copy()
        results['knn_distance'] = distances

        # Apply gender/type filter
        results = results[valid_mask].copy()

        # FIX: guard against k being larger than the filtered result set
        k = min(k, len(results))
        if k == 0:
            print("[WARN] No hostels matched the hostel_type filter.")
            return pd.DataFrame()

        results['match_score'] = 1 / (1 + results['knn_distance'])

        top_k = results.nsmallest(k, 'knn_distance').copy()

        # Attach explanations
        top_k['explanation'] = [
            self.get_explanation(row, user_prefs_scaled)
            for _, row in top_k.iterrows()
        ]

        if show_details:
            print(f"\n{'='*80}")
            print(f"TOP {k} HOSTEL RECOMMENDATIONS")
            print(f"{'='*80}\n")

            for idx, (i, row) in enumerate(top_k.iterrows(), 1):
                print(f"{idx}. {row.get('Name', 'N/A')} [{row.get('Hostel_Type', 'N/A')}]")
                print(f"   Address: {row.get('Address', 'N/A')}")
                print(f"   Distance from CUSAT: {row.get('Distance_from_CUSAT_km', 'N/A'):.2f} km")
                print(f"   Monthly Rent: Rs.{row.get('Estimated_Monthly_Rent', 'N/A'):.0f}")
                print(f"   Rating: {row.get('Rating', 'N/A'):.1f} "
                      f"({row.get('Rating_Count', 0):.0f} reviews)")
                print(f"   Safety Score: {row.get('Safety_Score', 'N/A'):.0f}/10")
                print(f"   Food Quality: {row.get('Food_Quality_Score', 'N/A'):.0f}/10")
                print(f"   Match Score: {row['match_score']:.2%}")

                amenities = []
                if row.get('WiFi_Available', 0):     amenities.append('WiFi')
                if row.get('Food_Available', 0):     amenities.append('Food')
                if row.get('AC_Available', 0):       amenities.append('AC')
                if row.get('Parking_Available', 0):  amenities.append('Parking')
                if row.get('Laundry_Available', 0):  amenities.append('Laundry')
                if row.get('CCTV_Security', 0):      amenities.append('CCTV')

                print(f"   Amenities: {', '.join(amenities) if amenities else 'None listed'}")
                print()

        return top_k

    def interactive_recommend(self):
        """Interactive recommendation with user input"""
        print("\n" + "="*80)
        print("HOSTEL RECOMMENDATION SYSTEM - CUSAT")
        print("="*80)
        print("\nPlease enter your preferences (press Enter to use default values):\n")

        user_prefs = {}

        # FIX: ask for hostel type so the gender filter is applied in interactive mode
        hostel_type_input = input(
            "Hostel type (Gents / Ladies / Mixed) [default: Mixed]: "
        ).strip().capitalize()
        if hostel_type_input in ('Gents', 'Ladies', 'Mixed'):
            user_prefs['hostel_type'] = hostel_type_input
        else:
            user_prefs['hostel_type'] = 'Mixed'

        # Distance
        dist = input("Maximum distance from CUSAT (km) [default: 5]: ").strip()
        user_prefs['Distance_from_CUSAT_km'] = float(dist) if dist else 5.0

        # Budget
        rent = input("Maximum monthly rent (₹) [default: 5000]: ").strip()
        user_prefs['Estimated_Monthly_Rent'] = float(rent) if rent else 5000

        # Safety
        safety = input("Minimum safety score (0-10) [default: 7]: ").strip()
        user_prefs['Safety_Score'] = float(safety) if safety else 7

        # Rating
        rating = input("Minimum rating (0-5) [default: 4]: ").strip()
        user_prefs['Rating'] = float(rating) if rating else 4.0

        # Food quality
        food_qual = input("Minimum food quality score (0-10) [default: 6]: ").strip()
        user_prefs['Food_Quality_Score'] = float(food_qual) if food_qual else 6

        # Amenities
        print("\nRequired amenities (y/n):")
        user_prefs['WiFi_Available']     = 1 if input("  WiFi [y/n]: ").strip().lower() == 'y' else 0
        user_prefs['Food_Available']     = 1 if input("  Food [y/n]: ").strip().lower() == 'y' else 0
        user_prefs['AC_Available']       = 1 if input("  AC [y/n]: ").strip().lower() == 'y' else 0
        user_prefs['Parking_Available']  = 1 if input("  Parking [y/n]: ").strip().lower() == 'y' else 0
        user_prefs['Laundry_Available']  = 1 if input("  Laundry [y/n]: ").strip().lower() == 'y' else 0
        user_prefs['CCTV_Security']      = 1 if input("  CCTV [y/n]: ").strip().lower() == 'y' else 0

        # Number of recommendations
        k = input("\nHow many recommendations do you want? [default: 5]: ").strip()
        k = int(k) if k else 5

        recommendations = self.recommend(user_prefs, k=k, show_details=True)
        return recommendations


def main():
    """Main execution function"""
    recommender = HostelRecommender()

    recommender.load_data()
    recommender.preprocess_data()
    recommender.prepare_features()

    print("\n" + "="*80)
    print("KNN Model Ready!")
    print("="*80)

    print("\n--- EXAMPLE RECOMMENDATION ---")
    example_prefs = {
        'hostel_type': 'Gents',
        'Distance_from_CUSAT_km': 3.0,
        'Estimated_Monthly_Rent': 4500,
        'Safety_Score': 8,
        'Rating': 4.5,
        'Food_Quality_Score': 7,
        'WiFi_Available': 1,
        'Food_Available': 1,
        'AC_Available': 0,
        'Parking_Available': 1,
        'Laundry_Available': 1,
        'CCTV_Security': 1,
        'Is_Clean': 1,
        'Open_24x7': 0
    }

    recommender.recommend(example_prefs, k=3, show_details=True)

    print("\n" + "="*80)
    choice = input("\nWould you like to get personalized recommendations? (y/n): ").strip().lower()
    if choice == 'y':
        recommender.interactive_recommend()

    print("\n[OK] Program complete!")


if __name__ == "__main__":
    main()