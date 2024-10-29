import { LOGIN_LINK, SIGNUP_LINK } from '../demo-credentials.js';
    
      function loadLink(link) {
        window.location.href = link;
      }
    
      document.addEventListener("DOMContentLoaded", function() {
        document.getElementById('loginBtn').onclick = function() {
          loadLink(LOGIN_LINK);
        };
    
        document.getElementById('signupBtn').onclick = function() {
          loadLink(SIGNUP_LINK);
        };
      });