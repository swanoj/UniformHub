import { describe, it, expect } from 'vitest';

export function validatePost(form: any, imageCount: number, agreedToTerms: boolean, isMember: boolean) {
  if (!isMember) return 'You need an active membership to post.';
  if (!agreedToTerms) return 'You must agree to the Terms & Conditions.';
  if (imageCount === 0) return 'Please add at least one photo.';
  if (form.price && parseFloat(form.price) < 0) return 'Price cannot be negative.';
  if (form.originalPrice && parseFloat(form.originalPrice) < 0) return 'Original price cannot be negative.';
  return null;
}

describe('Create Post Validation', () => {
  it('should fail if not a member', () => {
    const error = validatePost({}, 1, true, false);
    expect(error).toBe('You need an active membership to post.');
  });

  it('should fail if terms not agreed', () => {
    const error = validatePost({}, 1, false, true);
    expect(error).toBe('You must agree to the Terms & Conditions.');
  });

  it('should fail if no images', () => {
    const error = validatePost({}, 0, true, true);
    expect(error).toBe('Please add at least one photo.');
  });

  it('should pass for valid input', () => {
    const error = validatePost({ price: '10' }, 1, true, true);
    expect(error).toBeNull();
  });
  
  it('should fail if negative price', () => {
    const error = validatePost({ price: '-10' }, 1, true, true);
    expect(error).toBe('Price cannot be negative.');
  });
});
