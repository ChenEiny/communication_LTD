document.getElementById('change-password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const existingPassword = document.getElementById('existing-password').value;
    const newPassword = document.getElementById('new-password').value;
    try{
    const response = await fetch('/change-password', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, existingPassword, newPassword })
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error);
    }

    alert(data.message);
  }catch (error) {
    alert(error.message);
  }
  });
  