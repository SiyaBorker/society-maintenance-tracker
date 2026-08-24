/**
 * Who may post (or view) a comment on a complaint: any admin, or the
 * resident who raised it — the same rule already used for reading a
 * complaint's detail view, extracted here so it's independently testable
 * and shared instead of re-implemented per endpoint.
 */
function canComment(user, complaint) {
  if (user.role === 'ADMIN') return true;
  return user.role === 'RESIDENT' && complaint.residentId === user.id;
}

module.exports = { canComment };
