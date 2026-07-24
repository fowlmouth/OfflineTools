import yaml from 'js-yaml';

export default {
  validate: (input) => {
    try {
      yaml.load(input);
      return { valid: true, error: null };
    } catch (e) {
      return { valid: false, error: e.message };
    }
  },
  toJson: (input) => {
    const parsed = yaml.load(input);
    return JSON.stringify(parsed, null, 2);
  },
};
