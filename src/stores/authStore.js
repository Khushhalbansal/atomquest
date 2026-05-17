import { create } from 'zustand';
import { SEED_USERS, SEED_CREDENTIALS } from '../data/seedData';
import { storage } from '../utils/helpers';
import { ROLES } from '../utils/constants';
import { v4 as uuidv4 } from 'uuid';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// Ensure seed credentials are always available even after localStorage.clear()
const getInitialUsers = () => {
  const stored = storage.get('registeredUsers', null);
  if (!stored) return [...SEED_USERS];
  // Merge: keep seed users + any registered users not in seed
  const seedIds = new Set(SEED_USERS.map(u => u.id));
  const extra = stored.filter(u => !seedIds.has(u.id));
  return [...SEED_USERS, ...extra];
};

const getInitialCredentials = () => {
  const stored = storage.get('registeredCredentials', null);
  if (!stored) return [...SEED_CREDENTIALS];
  const seedEmails = new Set(SEED_CREDENTIALS.map(c => c.email.toLowerCase()));
  const extra = stored.filter(c => !seedEmails.has(c.email.toLowerCase()));
  return [...SEED_CREDENTIALS, ...extra];
};

const useAuthStore = create((set, get) => ({
  currentUser: storage.get('currentUser', null),
  users: getInitialUsers(),
  credentials: getInitialCredentials(),
  isAuthenticated: !!storage.get('currentUser', null),
  loginAttempts: 0,
  isLocked: false,
  lockUntil: null,

  // --- JWT-like login with brute-force protection ---
  login: (email, password) => {
    const state = get();

    // Check lockout
    if (state.isLocked && state.lockUntil && Date.now() < state.lockUntil) {
      const mins = Math.ceil((state.lockUntil - Date.now()) / 60000);
      return { success: false, message: `Account locked. Try again in ${mins} minute(s).` };
    }

    // Clear expired lock
    if (state.isLocked && Date.now() >= (state.lockUntil || 0)) {
      set({ isLocked: false, lockUntil: null, loginAttempts: 0 });
    }

    // Find credentials
    const cred = state.credentials.find(c => c.email.toLowerCase() === email.toLowerCase());
    if (!cred || cred.password !== password) {
      const attempts = state.loginAttempts + 1;
      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        const lockUntil = Date.now() + LOCK_DURATION_MS;
        set({ loginAttempts: attempts, isLocked: true, lockUntil });
        return { success: false, message: `Too many failed attempts. Locked for 15 minutes.` };
      }
      set({ loginAttempts: attempts });
      return { success: false, message: `Invalid credentials. ${MAX_LOGIN_ATTEMPTS - attempts} attempts remaining.` };
    }

    // Successful login
    const user = state.users.find(u => (cred.userId && u.id === cred.userId) || u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return { success: false, message: 'User account not found.' };
    }

    // Generate session token
    const sessionToken = uuidv4();
    const loggedInUser = { ...user, sessionToken };

    storage.set('currentUser', loggedInUser);
    storage.set('sessionToken', sessionToken);
    set({ currentUser: loggedInUser, isAuthenticated: true, loginAttempts: 0, isLocked: false, lockUntil: null });
    return { success: true };
  },

  // --- Secure registration (Employee-only) ---
  register: (name, email, password, department) => {
    const state = get();

    // Check if email already exists
    const exists = state.credentials.some(c => c.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      return { success: false, message: 'An account with this email already exists.' };
    }

    // Create new Employee user
    const userId = `user-${uuidv4().slice(0, 8)}`;
    const newUser = {
      id: userId,
      name,
      email,
      role: ROLES.EMPLOYEE, // Always Employee — security measure
      department,
      managerId: null,
      avatar: null,
    };

    const newCred = { email, password, userId };

    const updatedUsers = [...state.users, newUser];
    const updatedCreds = [...state.credentials, newCred];

    storage.set('registeredUsers', updatedUsers);
    storage.set('registeredCredentials', updatedCreds);

    // Auto-login
    const sessionToken = uuidv4();
    const loggedInUser = { ...newUser, sessionToken };
    storage.set('currentUser', loggedInUser);
    storage.set('sessionToken', sessionToken);

    set({
      users: updatedUsers,
      credentials: updatedCreds,
      currentUser: loggedInUser,
      isAuthenticated: true,
    });

    return { success: true };
  },

  // --- Demo user switching (kept for hackathon demo) ---
  switchUser: (userId) => {
    const user = get().users.find(u => u.id === userId);
    if (user) {
      const sessionToken = uuidv4();
      const loggedInUser = { ...user, sessionToken };
      storage.set('currentUser', loggedInUser);
      set({ currentUser: loggedInUser, isAuthenticated: true });
    }
  },

  switchRole: (role) => {
    const usersOfRole = get().users.filter(u => u.role === role);
    if (usersOfRole.length > 0) {
      const sessionToken = uuidv4();
      const loggedInUser = { ...usersOfRole[0], sessionToken };
      storage.set('currentUser', loggedInUser);
      set({ currentUser: loggedInUser, isAuthenticated: true });
    }
  },

  logout: () => {
    storage.remove('currentUser');
    storage.remove('sessionToken');
    set({ currentUser: null, isAuthenticated: false });
  },

  // --- Role checks ---
  isEmployee: () => get().currentUser?.role === ROLES.EMPLOYEE,
  isManager: () => get().currentUser?.role === ROLES.MANAGER,
  isAdmin: () => get().currentUser?.role === ROLES.ADMIN,

  getTeamMembers: () => {
    const user = get().currentUser;
    if (!user) return [];
    if (user.role === ROLES.ADMIN) return get().users;
    if (user.role === ROLES.MANAGER) {
      return get().users.filter(u => u.managerId === user.id || u.id === user.id);
    }
    return [user];
  },

  getUserById: (id) => get().users.find(u => u.id === id),
}));

export default useAuthStore;
