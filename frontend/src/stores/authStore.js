


let user = {};
try {
  user = JSON.parse(sessionStorage.getItem('auth_user')) || {};
} catch (e) {}

export const setUser = (u) => { 
  user = u || {}; 
  if (u) {
    sessionStorage.setItem('auth_user', JSON.stringify(user));
  } else {
    sessionStorage.removeItem('auth_user');
  }
};
export const getUser = () => user;
