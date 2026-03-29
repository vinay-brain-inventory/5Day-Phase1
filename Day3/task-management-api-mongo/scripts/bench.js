import autocannon from 'autocannon';

const baseUrl = process.env.BENCH_URL ?? 'http://127.0.0.1:3001';
const url = `${baseUrl}/health`;

autocannon(
  {
    url,
    connections: 50,
    duration: 10
  },
  (error, result) => {
    if (error) {
      console.error(error);
      process.exit(1);
    }
    console.log(autocannon.printResult(result));
  }
);

