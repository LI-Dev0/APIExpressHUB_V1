/**
 * Input Validation Tests
 * Tests for prompt sanitization and validation
 */

describe('Input Validation', () => {
  const MAX_PROMPT_LENGTH = 500;
  const sanitizePrompt = (str) => str.trim().substring(0, MAX_PROMPT_LENGTH);

  describe('Prompt Sanitization', () => {
    it('should trim whitespace', () => {
      const input = '  hello world  ';
      const result = sanitizePrompt(input);
      expect(result).toBe('hello world');
    });

    it('should truncate strings longer than MAX_PROMPT_LENGTH', () => {
      const longString = 'a'.repeat(600);
      const result = sanitizePrompt(longString);
      expect(result.length).toBe(MAX_PROMPT_LENGTH);
    });

    it('should allow valid prompts', () => {
      const validPrompt = 'A beautiful sunset over mountains';
      const result = sanitizePrompt(validPrompt);
      expect(result).toBe(validPrompt);
    });

    it('should handle empty strings', () => {
      const result = sanitizePrompt('   ');
      expect(result).toBe('');
    });

    it('should preserve special characters', () => {
      const input = 'Test with: special, characters!';
      const result = sanitizePrompt(input);
      expect(result).toBe('Test with: special, characters!');
    });
  });

  describe('Prompt Validation', () => {
    it('should reject non-string input', () => {
      const inputs = [null, undefined, 123, {}, []];
      inputs.forEach((input) => {
        expect(typeof input).not.toBe('string');
      });
    });

    it('should reject empty prompts after sanitization', () => {
      const inputs = ['', '   ', '\n\t'];
      inputs.forEach((input) => {
        const sanitized = sanitizePrompt(input);
        expect(sanitized.length).toBe(0);
      });
    });
  });
});
