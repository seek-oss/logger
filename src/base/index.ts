import os from 'os';

export default {
  pid: process.pid,
  hostname: os.hostname(),
  build: process.env.BUILD_NUMBER,
  commit: process.env.COMMIT_SHA,
};
