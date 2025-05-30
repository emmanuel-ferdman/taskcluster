import slugid from 'slugid';

export class TestReporter {
  constructor({ bucket = [], log = false }) {
    this.internal = [];
    this.bucket = bucket;
    this.log = log;
  }

  report(error, level, extra) {
    this.internal.push(error);
    return slugid.v4();
  }

  // Try to simulate this needing to be awaited
  async flush() {
    await new Promise((accept, reject) => {
      setTimeout(accept, 500);
    });
    this.internal.forEach(e => {
      this.bucket.push(e);
      if (this.log) {
        console.log('REPORTED ERROR');
      }
    });
  }
}

export default TestReporter;
