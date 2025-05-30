import path from 'path';
import { strict as assert } from 'assert';
import Method from './Method.js';
import { loadSql } from './util.js';

/** @typedef {import('./Method.js').MethodDefinition} MethodDefinition */
/** @typedef {{
  version: number,
  migrationScript?: string,
  downgradeScript?: string,
  description: string,
  methods: Record<string, MethodDefinition>
}} VersionDefinition */

const ALLOWED_KEYS = ['version', 'migrationScript', 'downgradeScript', 'methods', 'description'];

class Version {
  /**
   * Load a Version from the content of a db/versions/nnn.yml file
   *
   * @param {VersionDefinition} content
   * @param {string} filename
   */
  static fromYamlFileContent(content, filename) {
    Version._checkContent(content, filename);

    return new Version(
      content.version,
      loadSql(content.migrationScript, path.dirname(filename)),
      loadSql(content.downgradeScript, path.dirname(filename)),
      content.description,
      Object.fromEntries(Object.entries(content.methods).map(
        ([name, meth]) => [name, Method.fromYamlFileContent(name, meth, filename)],
      )),
    );
  }

  /**
   * Load a Version from a serialized representation
   *
   * @param {VersionDefinition} serializable
   * @returns {Version}
   */
  static fromSerializable(serializable) {
    for (let k of Object.keys(serializable)) {
      if (!ALLOWED_KEYS.includes(k)) {
        throw new Error(`unexpected version key ${k}`);
      }
    }
    return new Version(
      serializable.version,
      serializable.migrationScript,
      serializable.downgradeScript,
      serializable.description,
      Object.fromEntries(Object.entries(serializable.methods).map(
        ([name, meth]) => [name, Method.fromSerializable(name, meth)],
      )),
    );
  }

  /**
   * Create a serialized representation
   */
  asSerializable() {
    return {
      version: this.version,
      migrationScript: this.migrationScript,
      downgradeScript: this.downgradeScript,
      description: this.description,
      methods: Object.fromEntries(Object.entries(this.methods).map(
        ([name, meth]) => [name, meth.asSerializable()],
      )),
    };
  }

  /**
   * Create a Version
   * @param {number} version - version number
   * @param {string|undefined} migrationScript - upgrade script SQL content
   * @param {string|undefined} downgradeScript - downgrade script SQL content
   * @param {string} description - version description
   * @param {Object<string, Method>} methods - mapping of method name to Method instance
   */
  constructor(version, migrationScript, downgradeScript, description, methods) {
    this.version = version;
    this.migrationScript = migrationScript;
    this.downgradeScript = downgradeScript;
    this.description = description;
    this.methods = methods;
  }

  /**
   * @param {VersionDefinition} content
   * @param {string} filename
   * @private
   */
  static _checkContent(content, filename) {
    assert(content.version, `version field missing in ${filename}`);
    assert(content.methods, `methods field missing in ${filename}`);

    assert(!(Boolean(content.migrationScript) !== Boolean(content.downgradeScript)),
      `Cannot specify just one of migrationScript and downgradeScript in ${filename}`);

    for (const k of Object.keys(content)) {
      if (!ALLOWED_KEYS.includes(k)) {
        throw new Error(`Unknown version field ${k} in ${filename}`);
      }
    }

    const fileBase = path.basename(filename, '.yml');
    assert.equal(content.version, Number(fileBase), `filename ${filename} must match version`);
  }
}

export default Version;
