// Toggle between login and signup forms
function toggleForms() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    loginForm.classList.toggle('hidden');
    signupForm.classList.toggle('hidden');
}

// Handle login form submission
function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    // Basic validation (in a real app, you'd send this to a server)
    console.log('Login attempt:', { email, password });

    // Store user session (simple localStorage for demo)
    localStorage.setItem('userEmail', email);
    localStorage.setItem('isLoggedIn', 'true');

    // Redirect to hostels page
    window.location.href = 'hostels.html';
}

// Handle signup form submission
function handleSignup(event) {
    event.preventDefault();

    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    // Basic validation (in a real app, you'd send this to a server)
    console.log('Signup attempt:', { name, email, password });

    // Store user session (simple localStorage for demo)
    localStorage.setItem('userName', name);
    localStorage.setItem('userEmail', email);
    localStorage.setItem('isLoggedIn', 'true');

    // Redirect to hostels page
    window.location.href = 'hostels.html';
}