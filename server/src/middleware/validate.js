// Turns a zod schema into express middleware. The first issue is returned to the
// client so a guest sees a sentence, not a validation dump.
export const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body || {});
  if (!result.success) {
    const issue = result.error.issues?.[0];
    const field = issue?.path?.join('.') || '';
    return res.status(400).json({
      success: false,
      message: issue ? `${field ? `${field}: ` : ''}${issue.message}` : 'Invalid request',
    });
  }
  req.body = result.data;
  return next();
};

export default validateBody;
