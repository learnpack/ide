#!/usr/bin/env node
// Validates docs/components_v2.yml.
//
// learnpack-cli reads this file from master on every interactivity generation
// and stops the generation when it cannot use it, so a broken file must never
// reach master. Run: node scripts/validate-components-v2.js [path]

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const IMAGE_COMPONENTS = [
  "technical_diagram",
  "conceptual_illustration",
  "realistic_photography",
];
const CATEGORIES = ["assessment", "explanatory"];
const DECIDED_BY = ["syllabus", "interactivity"];

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;
const isNonEmptyStringList = (value) =>
  Array.isArray(value) && value.length > 0 && value.every(isNonEmptyString);
const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

function validateComponent(component, index, errors) {
  const where = isNonEmptyString(component && component.name)
    ? `component "${component.name}"`
    : `component #${index + 1}`;

  if (!isPlainObject(component)) {
    errors.push(`${where}: must be an object`);
    return;
  }
  if (!isNonEmptyString(component.name)) {
    errors.push(`${where}: missing name`);
  } else if (!/^[a-z][a-z0-9_]*$/.test(component.name)) {
    errors.push(`${where}: name must be snake_case (it is a structured output key)`);
  }
  if (!CATEGORIES.includes(component.category)) {
    errors.push(`${where}: category must be one of ${CATEGORIES.join(", ")}`);
  }
  if (!DECIDED_BY.includes(component.decidedBy)) {
    errors.push(`${where}: decidedBy must be one of ${DECIDED_BY.join(", ")}`);
  }

  const choose = component.choose;
  if (!isPlainObject(choose) || !isNonEmptyString(choose.summary)) {
    errors.push(`${where}: choose.summary is required`);
  } else if (component.decidedBy === "interactivity") {
    for (const key of ["goodFor", "avoid", "tests"]) {
      if (!isNonEmptyStringList(choose[key])) {
        errors.push(
          `${where}: choose.${key} must be a non-empty list of strings when decidedBy is interactivity`
        );
      }
    }
  }

  const write = component.write;
  if (!isPlainObject(write) || !isPlainObject(write.fields)) {
    errors.push(`${where}: write.fields is required`);
  } else {
    const fieldEntries = Object.entries(write.fields);
    if (fieldEntries.length === 0) {
      errors.push(`${where}: write.fields must describe at least one field`);
    }
    for (const [field, description] of fieldEntries) {
      if (!isNonEmptyString(description)) {
        errors.push(`${where}: write.fields.${field} must be a non-empty string`);
      }
    }
    if (!Object.prototype.hasOwnProperty.call(write.fields, "id")) {
      errors.push(`${where}: write.fields must describe id (placeholders use it)`);
    }
  }
  if (write && write.rules !== undefined && !isNonEmptyStringList(write.rules)) {
    errors.push(`${where}: write.rules must be a non-empty list of strings`);
  }

  if (IMAGE_COMPONENTS.includes(component.name) && !isNonEmptyString(component.visualStyle)) {
    errors.push(`${where}: visualStyle is required for images`);
  }
  if (component.syntax !== undefined) {
    errors.push(
      `${where}: syntax is not allowed yet; it moves here only when the IDE adopts this file`
    );
  }
}

function validate(document) {
  const errors = [];
  if (!isPlainObject(document)) {
    return ["the file must contain a YAML object"];
  }
  if (!isNonEmptyString(document.version)) {
    errors.push("version is required");
  }
  if (!Array.isArray(document.components) || document.components.length === 0) {
    errors.push("components must be a non-empty list");
    return errors;
  }

  const seen = new Set();
  document.components.forEach((component, index) => {
    validateComponent(component, index, errors);
    const name = component && component.name;
    if (isNonEmptyString(name)) {
      if (seen.has(name)) errors.push(`component "${name}": duplicated name`);
      seen.add(name);
    }
  });
  return errors;
}

function main() {
  const file = path.resolve(
    process.argv[2] || path.join(__dirname, "..", "docs", "components_v2.yml")
  );
  let document;
  try {
    document = yaml.load(fs.readFileSync(file, "utf8"));
  } catch (error) {
    console.error(`✖ ${file} could not be read or parsed:\n  ${error.message}`);
    process.exit(1);
  }

  const errors = validate(document);
  if (errors.length > 0) {
    console.error(`✖ ${file} has ${errors.length} problem(s):`);
    for (const error of errors) console.error(`  - ${error}`);
    process.exit(1);
  }
  console.log(`✔ ${file} is valid (${document.components.length} components)`);
}

if (require.main === module) {
  main();
}

module.exports = { validate };
