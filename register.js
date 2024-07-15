document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const email = document.getElementById('email').value;
    try {
    const response = await fetch('/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password, email })
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error);
    }

    alert(data.message);
  } catch (error) {
    alert(error.message);
  }
  });

  