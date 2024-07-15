module.exports = {
    passwordPolicy: {
      minLength: 10,
      requireUpperCase: true,
      requireLowerCase: true,
      requireSpecialCharacters: true,
      requireDigits: true,
      avoidLexicographicOrder: true,
      passwordHistoryLimit: 3
    },
    loginAttempts: {
      maxAttempts: 3
    },
    emailSettings: {
      service: 'Gmail',
      auth: {
        user: 'your-email@gmail.com',
        pass: 'your-email-password'
      }
    }
  };
  
  