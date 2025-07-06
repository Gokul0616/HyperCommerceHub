export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*/.test(error.message);
}

export function requireAuth(user: any, toast: any) {
  if (!user) {
    toast({
      title: "Authentication Required",
      description: "Please login to access this page.",
      variant: "destructive",
    });
    return false;
  }
  return true;
}

export function requireAdmin(user: any, toast: any) {
  if (!user || user.role !== 'admin') {
    toast({
      title: "Access Denied",
      description: "Admin access required.",
      variant: "destructive",
    });
    return false;
  }
  return true;
}
