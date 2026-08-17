App({
  onLaunch() {
    // 获取当前小程序版本
    const { envVersion } = wx.getAccountInfoSync().miniProgram;
    const isDev = envVersion === 'develop' || envVersion === 'trial';

    // 正式版下屏蔽控制台输出
    if (!isDev) {
      const noop = () => {};
      console.log = noop;
      console.warn = noop;
      console.error = noop;   // 如需保留错误日志，可注释此行
    }
  },
  globalData: {}
});