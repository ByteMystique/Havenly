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

    // Show loading
    if (typeof loader !== 'undefined') {
        loader.show('Logging in...');
    }

    // Simulate API call
    setTimeout(() => {
        // Store user session (simple localStorage for demo)
        localStorage.setItem('userEmail', email);
        localStorage.setItem('isLoggedIn', 'true');

        if (typeof loader !== 'undefined') {
            loader.hide();
        }

        // Show success toast
        if (typeof toast !== 'undefined') {
            toast.success('Welcome back!', 'Login successful', 2000);
        }

        // Redirect to hostels page
        setTimeout(() => {
            window.location.href = 'hostels.html';
        }, 500);
    }, 800);
}

// Handle signup form submission
function handleSignup(event) {
    event.preventDefault();

    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    // Basic validation (in a real app, you'd send this to a server)
    console.log('Signup attempt:', { name, email, password });

    // Show loading
    if (typeof loader !== 'undefined') {
        loader.show('Creating account...');
    }

    // Simulate API call
    setTimeout(() => {
        // Store user session (simple localStorage for demo)
        localStorage.setItem('userName', name);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('isLoggedIn', 'true');

        if (typeof loader !== 'undefined') {
            loader.hide();
        }

        // Show success toast
        if (typeof toast !== 'undefined') {
            toast.success('Account created!', 'Welcome to Havenly', 2000);
        }

        // Redirect to hostels page
        setTimeout(() => {
            window.location.href = 'hostels.html';
        }, 500);
    }, 800);
}