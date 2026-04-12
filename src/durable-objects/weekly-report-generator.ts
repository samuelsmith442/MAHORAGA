// Weekly report generation logic
// This file contains the logic to generate comprehensive weekly performance reports

interface TradeHistory {
  symbol: string;
  entry_price: number;
  exit_price: number;
  entry_time: number;
  exit_time: number;
  pnl: number;
  pnl_pct: number;
  exit_reason: string;
  entry_quality?: string;
}

interface WeeklyReportData {
  trades: TradeHistory[];
  costTracker: { total_usd: number; calls: number; tokens_in: number; tokens_out: number };
  researchModel: string;
  analystModel: string;
}

export function getWeekBounds(date: Date = new Date()): { start: number; end: number } {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  
  // Get Monday of current week
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  d.setUTCDate(diff);
  const weekStart = d.getTime();
  
  // Get Sunday end of week
  const endDate = new Date(weekStart);
  endDate.setUTCDate(endDate.getUTCDate() + 6);
  endDate.setUTCHours(23, 59, 59, 999);
  const weekEnd = endDate.getTime();
  
  return { start: weekStart, end: weekEnd };
}

export function generateWeeklyReport(data: WeeklyReportData, weekStart: number, weekEnd: number) {
  const weekTrades = data.trades.filter(t => t.exit_time >= weekStart && t.exit_time <= weekEnd);
  
  // Trading performance
  const wins = weekTrades.filter(t => t.pnl > 0);
  const losses = weekTrades.filter(t => t.pnl < 0);
  const totalPnl = weekTrades.reduce((sum, t) => sum + t.pnl, 0);
  const winRate = weekTrades.length > 0 ? (wins.length / weekTrades.length) * 100 : 0;
  
  // Best and worst trades
  const sortedByPnl = [...weekTrades].sort((a, b) => b.pnl_pct - a.pnl_pct);
  const bestTrade = sortedByPnl[0] || null;
  const worstTrade = sortedByPnl[sortedByPnl.length - 1] || null;
  
  // Asset type breakdown
  const cryptoSymbols = ['BTC/USD', 'ETH/USD', 'SOL/USD', 'DOGE/USD', 'AVAX/USD', 'LINK/USD', 'DOT/USD', 'MATIC/USD', 'UNI/USD', 'AAVE/USD'];
  const isCrypto = (symbol: string) => cryptoSymbols.includes(symbol) || symbol.includes('/') || symbol.endsWith('USD');
  
  const cryptoTrades = weekTrades.filter(t => isCrypto(t.symbol));
  const stockTrades = weekTrades.filter(t => !isCrypto(t.symbol));
  const shortTrades = weekTrades.filter(t => t.exit_reason.toLowerCase().includes('short'));
  
  const calcStats = (trades: TradeHistory[]) => {
    const w = trades.filter(t => t.pnl > 0);
    return {
      trades: trades.length,
      pnl_usd: trades.reduce((sum, t) => sum + t.pnl, 0),
      win_rate_pct: trades.length > 0 ? (w.length / trades.length) * 100 : 0,
    };
  };
  
  // Exit reason analysis
  const exitCounts = {
    take_profit: weekTrades.filter(t => t.exit_reason.toLowerCase().includes('take profit')).length,
    stop_loss: weekTrades.filter(t => t.exit_reason.toLowerCase().includes('stop loss')).length,
    trailing_stop: weekTrades.filter(t => t.exit_reason.toLowerCase().includes('trailing stop')).length,
    early_profit_protection: weekTrades.filter(t => t.exit_reason.toLowerCase().includes('early profit protection')).length,
    stale_exit: weekTrades.filter(t => t.exit_reason.toLowerCase().includes('stale')).length,
    manual: weekTrades.filter(t => !['take profit', 'stop loss', 'trailing', 'stale'].some(kw => t.exit_reason.toLowerCase().includes(kw))).length,
  };
  
  // Model accuracy
  const buyTrades = weekTrades.filter(t => t.entry_quality);
  const excellentTrades = buyTrades.filter(t => t.entry_quality === 'excellent');
  const goodTrades = buyTrades.filter(t => t.entry_quality === 'good');
  
  const excellentWins = excellentTrades.filter(t => t.pnl > 0);
  const goodWins = goodTrades.filter(t => t.pnl > 0);
  
  const researchBuyAccuracy = buyTrades.length > 0 ? (buyTrades.filter(t => t.pnl > 0).length / buyTrades.length) * 100 : 0;
  const excellentWinRate = excellentTrades.length > 0 ? (excellentWins.length / excellentTrades.length) * 100 : 0;
  const goodWinRate = goodTrades.length > 0 ? (goodWins.length / goodTrades.length) * 100 : 0;
  
  // Calculate correlation (simplified - would need more data for true correlation)
  const analystCorrelation = 0; // Placeholder - would need confidence data in TradeHistory
  
  // Generate insights
  const insights: string[] = [];
  const recommendations: string[] = [];
  
  if (winRate < 50 && weekTrades.length >= 5) {
    insights.push(`Win rate is below 50% (${winRate.toFixed(1)}%) - models may need adjustment`);
    recommendations.push('Review recent losing trades for common patterns');
  }
  
  if (excellentWinRate < goodWinRate && excellentTrades.length >= 3) {
    insights.push(`"Excellent" entries underperforming "good" entries (${excellentWinRate.toFixed(1)}% vs ${goodWinRate.toFixed(1)}%)`);
    recommendations.push('Research model may be over-confident - consider lowering entry quality thresholds');
  }
  
  if (exitCounts.stop_loss > exitCounts.take_profit && weekTrades.length >= 5) {
    insights.push(`More stop losses (${exitCounts.stop_loss}) than take profits (${exitCounts.take_profit})`);
    recommendations.push('Consider tightening entry criteria or adjusting stop loss levels');
  }
  
  if (exitCounts.early_profit_protection > 0) {
    insights.push(`Early profit protection triggered ${exitCounts.early_profit_protection} times - saved potential losses`);
  }
  
  if (totalPnl > 0) {
    insights.push(`Profitable week with $${totalPnl.toFixed(2)} total P&L`);
  } else if (totalPnl < 0) {
    insights.push(`Losing week with $${totalPnl.toFixed(2)} total P&L`);
    recommendations.push('Consider reducing position sizes or pausing trading to reassess strategy');
  }
  
  if (data.costTracker.calls > 0) {
    const avgCost = data.costTracker.total_usd / data.costTracker.calls;
    if (avgCost > 0.01) {
      insights.push(`High average LLM cost per call: $${avgCost.toFixed(4)}`);
      recommendations.push('Consider using cheaper models for research calls');
    }
  }
  
  return {
    week_start: weekStart,
    week_end: weekEnd,
    generated_at: Date.now(),
    
    models: {
      research_model: data.researchModel,
      analyst_model: data.analystModel,
      total_llm_calls: data.costTracker.calls,
      total_llm_cost_usd: data.costTracker.total_usd,
      avg_cost_per_call: data.costTracker.calls > 0 ? data.costTracker.total_usd / data.costTracker.calls : 0,
    },
    
    trading: {
      total_trades: weekTrades.length,
      winning_trades: wins.length,
      losing_trades: losses.length,
      win_rate_pct: winRate,
      total_pnl_usd: totalPnl,
      avg_pnl_per_trade_usd: weekTrades.length > 0 ? totalPnl / weekTrades.length : 0,
      best_trade: bestTrade ? { symbol: bestTrade.symbol, pnl_pct: bestTrade.pnl_pct, exit_reason: bestTrade.exit_reason } : null,
      worst_trade: worstTrade ? { symbol: worstTrade.symbol, pnl_pct: worstTrade.pnl_pct, exit_reason: worstTrade.exit_reason } : null,
      
      stocks: calcStats(stockTrades),
      crypto: calcStats(cryptoTrades),
      shorts: calcStats(shortTrades),
    },
    
    exits: exitCounts,
    
    accuracy: {
      research_buy_accuracy_pct: researchBuyAccuracy,
      analyst_confidence_correlation: analystCorrelation,
      excellent_entry_win_rate_pct: excellentWinRate,
      good_entry_win_rate_pct: goodWinRate,
    },
    
    insights,
    recommendations,
  };
}
