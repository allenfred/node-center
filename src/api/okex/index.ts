import * as swap from './swap';
import * as common from './common';

export async function initOkexMarketMonitor(wsClient: any) {
  // 获取永续所有合约信息
  const swapInstruments = await swap.initInstruments();

  // 订阅永续所有频道信息
  wsClient.subscribe(...common.getSwapSubCommands(swapInstruments));
}
