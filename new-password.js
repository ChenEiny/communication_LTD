document.getElementById('new-password-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const newPassword = document.getElementById('new-password').value;

  try {
      const response = await fetch('/new-password', {
          method: 'PUT',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username, newPassword })
      });

      const data = await response.json();

      if (!response.ok) {
          throw new Error(data.error);
      }

      alert(data.message);

      // Redirect to the login page after a successful password change
      window.location.href = '/login.html';
  } catch (error) {
      alert(error.message);
  }
});
