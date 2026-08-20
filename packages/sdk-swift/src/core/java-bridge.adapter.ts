import { spawn } from 'child_process';

/**
 * Bridges Java JAR execution via Node.js child_process.
 * Useful for invoking SWIFT JAR utilities (e.g. MQ adapters, signature tools)
 * that do not have a native Node.js equivalent.
 */
export class JavaBridgeAdapter {
  private readonly jarPath: string;

  /**
   * @param jarPath Absolute or workspace-relative path to the target JAR file.
   */
  constructor(jarPath: string) {
    this.jarPath = jarPath;
  }

  /**
   * Executes a class inside the JAR file as a child process and resolves with
   * the combined stdout output.
   *
   * @param className Fully-qualified Java class name to invoke (e.g. `com.swift.Validator`).
   * @param args      Command-line arguments forwarded to the Java process.
   * @returns         Resolved stdout string on success; rejected with stderr on non-zero exit.
   */
  async execute(className: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const javaArgs = ['-cp', this.jarPath, className, ...args];
      const child = spawn('java', javaArgs);

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (chunk: Buffer) => {
        stdout += chunk.toString('utf8');
      });

      child.stderr.on('data', (chunk: Buffer) => {
        stderr += chunk.toString('utf8');
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve(stdout.trimEnd());
        } else {
          reject(
            new Error(
              `JavaBridgeAdapter: process exited with code ${code}.\nstderr: ${stderr.trimEnd()}`
            )
          );
        }
      });

      child.on('error', (err) => {
        reject(
          new Error(`JavaBridgeAdapter: failed to spawn Java process — ${err.message}`)
        );
      });
    });
  }
}
