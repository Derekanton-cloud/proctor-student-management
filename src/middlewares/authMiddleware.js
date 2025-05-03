/**
 * Authentication middleware for session-based authentication
 * Handles user authentication and role-based authorization
 */

/**
 * Check if user is authenticated via session
 */
const isAuthenticated = (req, res, next) => {
    console.log('Session in auth middleware:', req.session);
    console.log('User in session:', req.session?.user);
    
    if (req.session && req.session.user && req.session.user.id) {
        return next();
    }
    
    // If it's an API request, return JSON
    if (req.xhr || req.headers.accept?.includes('json')) {
        return res.status(401).json({ message: 'Unauthorized access' });
    }
    
    // For regular requests, redirect to login
    return res.redirect('/auth/login');
};

/**
 * Check if authenticated user has specific role
 * @param {string} role - Required role (student, proctor, admin)
 */
const checkRole = (role) => {
    return (req, res, next) => {
        if (!req.session || !req.session.user) {
            if (req.xhr || req.headers.accept?.includes('json')) {
                return res.status(401).json({ message: 'Unauthorized access' });
            }
            return res.redirect('/auth/login');
        }
        
        if (req.session.user.role !== role) {
            if (req.xhr || req.headers.accept?.includes('json')) {
                return res.status(403).json({ message: `Forbidden: ${role} access required` });
            }
            return res.redirect('/auth/login');
        }
        
        next();
    };
};

/**
 * Convenience middleware for student role
 */
const isStudent = (req, res, next) => {
    return checkRole('student')(req, res, next);
};

/**
 * Convenience middleware for proctor role
 */
const isProctor = (req, res, next) => {
    return checkRole('proctor')(req, res, next);
};

/**
 * Convenience middleware for admin role
 */
const isAdmin = (req, res, next) => {
    return checkRole('admin')(req, res, next);
};

module.exports = {
    isAuthenticated,
    checkRole,
    isStudent,
    isProctor,
    isAdmin
};