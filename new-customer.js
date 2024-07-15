document.getElementById('new-customer-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('id').value;
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const response = await fetch('/new-customer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id,firstName, lastName })
    });
    const data = await response.json();
    alert(data.message);
  });
  