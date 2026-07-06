import assert from 'node:assert/strict';
import { WalletController } from './wallet.controller';

function createResponseMock() {
  const response: any = {
    contentType: '',
    body: '',
    type(value: string) {
      this.contentType = value;
      return this;
    },
    send(value: string) {
      this.body = value;
      return this;
    },
  };
  return response;
}

async function run() {
  const calls: any[] = [];
  const walletService: any = {
    handleZpayNotify: async (params: any) => {
      calls.push(params);
      return true;
    },
  };
  const controller = new WalletController(walletService);

  const postResponse = createResponseMock();
  await controller.handleZpayNotify(
    {
      query: {},
      body: {
        out_trade_no: 'RE123',
        trade_status: 'TRADE_SUCCESS',
        money: '10.00',
        sign: 'abc',
      },
    } as any,
    postResponse,
  );

  assert.deepEqual(calls[0], {
    out_trade_no: 'RE123',
    trade_status: 'TRADE_SUCCESS',
    money: '10.00',
    sign: 'abc',
  });
  assert.equal(postResponse.contentType, 'text/plain');
  assert.equal(postResponse.body, 'success');

  const queryResponse = createResponseMock();
  await controller.handleZpayNotify(
    {
      query: {
        out_trade_no: 'RE456',
        money: ['20.00'],
      },
      body: undefined,
    } as any,
    queryResponse,
  );

  assert.deepEqual(calls[1], {
    out_trade_no: 'RE456',
    money: '20.00',
  });
  assert.equal(queryResponse.body, 'success');

  console.log('wallet controller ZPay notify test passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
