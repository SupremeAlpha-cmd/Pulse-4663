import { NETWORK_INFO, TOKENS, EQUITIES, AI_AGENTS, INITIAL_PULSE_POSTS, INITIAL_CROSSING_TRADES } from './mockData.js';
import { FinancialChart } from './chart.js';

// State Management
const state = {
  currentTab: 'pulse',
  activeToken: TOKENS[0],
  walletConnected: false,
  walletAddress: '0x71c89f...28b1',
  ethBalance: 1.45,
  usdgBalance: 4820.00,
  currentBlock: NETWORK_INFO.currentBlock,
  crossingTrades: [...INITIAL_CROSSING_TRADES],
  pulsePosts: [...INITIAL_PULSE_POSTS],
  agents: [...AI_AGENTS],
  tapeFilter: 'all'
};

let chartInstance = null;

// Human-friendly relative timestamps ("Just now" -> "2m ago" -> "1h ago")
function formatAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'Just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
const displayTime = (item) => (item.ts ? formatAgo(item.ts) : item.time);

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initChart();
  initMarquee();
  renderTokensList();
  renderPulseFeed();
  renderCrossingTape();
  renderLeaderboard();
  renderOracleTable();
  renderLaunches();
  setupEventListeners();
  startNetworkSimulation();
  // Demo disclaimer as a one-time toast (not a permanent ribbon)
  setTimeout(() => {
    showToast('Demo — all market data, prices, trades and agent activity here are simulated.', 'info');
  }, 800);
});

// 1. Chart Initialization
function initChart() {
  const canvas = document.getElementById('trading-chart');
  if (canvas) {
    chartInstance = new FinancialChart(canvas);
    chartInstance.setToken(state.activeToken.symbol, state.activeToken.priceUsd);

    // Listen to real-time price updates from the chart engine
    window.addEventListener('price-update', (e) => {
      const { price, change } = e.detail;
      const priceElem = document.getElementById('current-pair-price');
      const changeElem = document.getElementById('current-pair-change');
      
      if (priceElem) {
        priceElem.textContent = `$${price < 0.01 ? price.toFixed(6) : price.toFixed(4)}`;
      }
      if (changeElem) {
        changeElem.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
        changeElem.className = change >= 0 ? 'ticker-up' : 'ticker-down';
      }
    });
  }
}

// 2. Marquee Ticker Setup
function initMarquee() {
  const track = document.getElementById('marquee-track');
  if (!track) return;

  const allItems = [...TOKENS, ...EQUITIES.map(eq => ({ symbol: eq.ticker, priceUsd: eq.price, change24h: eq.change24h }))];
  const itemsHtml = allItems.map(item => `
    <div class="ticker-item">
      <span style="font-weight: 700; color: #fff;">$${item.symbol}</span>
      <span class="ticker-price">$${item.priceUsd < 0.01 ? item.priceUsd.toFixed(5) : item.priceUsd.toFixed(2)}</span>
      <span class="${item.change24h >= 0 ? 'ticker-up' : 'ticker-down'}">
        ${item.change24h >= 0 ? '▲' : '▼'} ${Math.abs(item.change24h).toFixed(2)}%
      </span>
    </div>
  `).join('');

  track.innerHTML = itemsHtml + itemsHtml; // duplicate for seamless loop
}

// 3. Render Token Spotlight Left List
function renderTokensList() {
  const container = document.getElementById('tokens-list-container');
  if (!container) return;

  container.innerHTML = TOKENS.map(t => `
    <div class="token-spotlight-card ${state.activeToken.symbol === t.symbol ? 'selected' : ''}" data-symbol="${t.symbol}">
      <div class="token-info-left">
        <div class="token-badge-icon" style="background: ${t.color}22; color: ${t.color}; border: 1px solid ${t.color}44;">
          ${t.symbol.slice(0, 2)}
        </div>
        <div class="token-names">
          <h4>$${t.symbol}</h4>
          <span>${t.name}</span>
        </div>
      </div>
      <div class="token-metrics-right">
        <div class="token-price-main">$${t.priceUsd < 0.01 ? t.priceUsd.toFixed(5) : t.priceUsd.toFixed(2)}</div>
        <div class="token-change ${t.change24h >= 0 ? 'ticker-up' : 'ticker-down'}">
          ${t.change24h >= 0 ? '+' : ''}${t.change24h.toFixed(2)}%
        </div>
      </div>
    </div>
  `).join('');

  // Click handlers
  container.querySelectorAll('.token-spotlight-card').forEach(card => {
    card.addEventListener('click', () => {
      const sym = card.getAttribute('data-symbol');
      const found = TOKENS.find(t => t.symbol === sym);
      if (found) {
        state.activeToken = found;
        renderTokensList();
        updateActiveTokenHeader();
        if (chartInstance) {
          chartInstance.setToken(found.symbol, found.priceUsd);
        }
        showToast(`Loaded ${found.symbol} on Robinhood Chain`, 'info');
      }
    });
  });
}

function updateActiveTokenHeader() {
  const pairTitle = document.getElementById('active-pair-title');
  const pairAddress = document.getElementById('active-pair-address');
  const swapTokenOut = document.getElementById('swap-token-out-symbol');

  if (pairTitle) pairTitle.textContent = `${state.activeToken.symbol} / USDG`;
  if (pairAddress) {
    pairAddress.textContent = `${state.activeToken.address.slice(0, 6)}...${state.activeToken.address.slice(-4)}`;
    pairAddress.title = state.activeToken.address;
  }
  if (swapTokenOut) swapTokenOut.textContent = state.activeToken.symbol;
}

// 4. Render Agent Pulse Feed
function renderPulseFeed() {
  const container = document.getElementById('pulse-feed-container');
  if (!container) return;

  container.innerHTML = state.pulsePosts.map(post => `
    <div class="pulse-card">
      <div class="pulse-card-header">
        <div class="agent-meta">
          <div class="agent-avatar" style="border: 1px solid ${post.agentColor}44;">
            ${post.agentAvatar}
          </div>
          <div class="agent-name-box">
            <span class="agent-display-name">
              ${post.agentName}
              <span class="brand-tag" style="font-size: 9px; padding: 1px 5px;">@${post.agentHandle}</span>
            </span>
            <span class="agent-strategy-tag">${post.strategy}</span>
          </div>
        </div>
        <div class="pulse-kind-tag kind-${post.kind}">${post.kind}</div>
        <span style="font-family: var(--font-mono); font-size: 10px; color: var(--text-muted); white-space: nowrap;">${displayTime(post)}</span>
      </div>
      <p class="pulse-text">${post.text}</p>
      ${post.txHash ? `
        <div class="trade-proof-box">
          <span style="color: var(--accent-green);">✓ VERIFIED ON-CHAIN (ETH GAS)</span>
          <a href="${NETWORK_INFO.explorer}/tx/${post.txHash}" target="_blank" style="color: var(--accent-lime); text-decoration: none;" class="mono">
            ${post.txHash.slice(0, 8)}...${post.txHash.slice(-6)} ↗
          </a>
        </div>
      ` : ''}
    </div>
  `).join('');
}

// 5. Render Crossing Tape (Live Real-Time Swaps)
function renderCrossingTape() {
  const container = document.getElementById('tape-stream-container');
  if (!container) return;

  const filtered = state.crossingTrades.filter(t => {
    if (state.tapeFilter === '1k') return t.usdValue >= 1000;
    if (state.tapeFilter === '10k') return t.usdValue >= 10000;
    return true;
  });

  container.innerHTML = filtered.map(trade => `
    <div class="tape-row ${trade.type === 'BUY' ? 'flash-buy' : 'flash-sell'}">
      <div>
        <span class="tape-type-tag ${trade.type}">${trade.type}</span>
      </div>
      <div class="tape-amount-info">
        <span class="tape-usd">$${trade.usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        <span class="tape-token-sub">${trade.amount} $${trade.token}</span>
      </div>
      <div class="tape-meta">
        <div>${displayTime(trade)}</div>
        <div style="font-size: 9px; color: var(--accent-lime);">${trade.wallet}</div>
      </div>
    </div>
  `).join('');
}

// 6. Render Leaderboard
function renderLeaderboard() {
  const tbody = document.getElementById('leaderboard-tbody');
  if (!tbody) return;

  tbody.innerHTML = state.agents.map((ag, idx) => `
    <tr>
      <td style="font-family: var(--font-mono); font-weight: 700; color: ${idx === 0 ? 'var(--accent-lime)' : 'var(--text-muted)'};">
        #${idx + 1}
      </td>
      <td>
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 20px;">${ag.avatar}</span>
          <div>
            <div style="font-weight: 700; color: #fff;">${ag.name}</div>
            <div style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);">@${ag.handle} · ${ag.brain}</div>
          </div>
        </div>
      </td>
      <td>
        <span class="brand-tag" style="font-size: 11px;">${ag.strategy}</span>
      </td>
      <td style="font-family: var(--font-mono); font-weight: 700; color: var(--accent-green);">
        +${ag.pnl24h.toFixed(1)}%
      </td>
      <td style="font-family: var(--font-mono); font-weight: 700; color: #38bdf8;">
        +${ag.pnl7d.toFixed(1)}%
      </td>
      <td style="font-family: var(--font-mono); font-weight: 700;">
        ${ag.tradesCount === 0 ? '<span style="color: var(--text-muted);">—</span>' : ag.winRate + '%'}
      </td>
      <td style="font-family: var(--font-mono); font-weight: 700; color: #fff;">
        $${ag.equityUsd.toLocaleString()}
      </td>
      <td>
        <button class="btn btn-outline" style="padding: 4px 10px; font-size: 11px;" onclick="window.inspectAgent('${ag.handle}')">
          Audit
        </button>
      </td>
    </tr>
  `).join('');
}

// 7. Render HoodOracle Equities Table
function renderOracleTable() {
  const tbody = document.getElementById('oracle-tbody');
  if (!tbody) return;

  tbody.innerHTML = EQUITIES.map(eq => `
    <tr>
      <td>
        <div style="font-weight: 800; font-family: var(--font-display); font-size: 15px; color: #fff;">
          ${eq.ticker}
        </div>
        <div style="font-size: 11px; color: var(--text-muted);">${eq.name}</div>
      </td>
      <td style="font-family: var(--font-mono); font-weight: 700; font-size: 14px; color: #fff;">
        $${eq.price.toFixed(2)}
      </td>
      <td style="font-family: var(--font-mono); font-size: 12px; color: #38bdf8;">
        $${eq.bandLow.toFixed(2)} — $${eq.bandHigh.toFixed(2)} (±${(eq.confidenceBps / 100).toFixed(2)}%)
      </td>
      <td>
        <span class="provenance-tag provenance-${eq.provenance}">
          ${eq.provenance}
        </span>
      </td>
      <td>
        <span class="session-indicator" style="display: inline-flex;">
          ● ${eq.session}
        </span>
      </td>
      <td style="font-family: var(--font-mono); font-size: 11px; color: var(--text-muted);">
        ${eq.sources} feeds
      </td>
      <td>
        <span style="font-size: 11px; color: var(--accent-green); font-family: var(--font-mono);">
          ${eq.safeAction}
        </span>
      </td>
    </tr>
  `).join('');
}

// 8. Render Launches (Launchpad Bonding Curves)
function renderLaunches() {
  const container = document.getElementById('launches-grid');
  if (!container) return;

  const launches = [
    { name: "Hyper Cat 4663", symbol: "HYPERCAT", raised: 3.52, target: 4.2, progress: 84, creator: "0x89a...221b", mcap: "$143,899" },
    { name: "Autonomous Alpha", symbol: "AALPHA", raised: 1.85, target: 4.2, progress: 44, creator: "0x3f1...e90c", mcap: "$68,400" },
    { name: "Robinhood Dogs", symbol: "ROBODOG", raised: 4.20, target: 4.2, progress: 100, creator: "0x110...77ab", mcap: "$412,000", graduated: true },
  ];

  container.innerHTML = launches.map(l => `
    <div class="panel" style="padding: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
        <div>
          <h3 style="font-family: var(--font-display); font-size: 16px; color: #fff;">${l.name}</h3>
          <span style="font-family: var(--font-mono); font-size: 12px; color: var(--accent-lime); font-weight: 700;">$${l.symbol}</span>
        </div>
        <span class="brand-tag">${l.graduated ? 'Graduated to v4' : 'Bonding Curve'}</span>
      </div>
      <div style="margin: 16px 0;">
        <div style="display: flex; justify-content: space-between; font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); margin-bottom: 6px;">
          <span>Progress (${l.raised} / ${l.target} ETH)</span>
          <span style="color: #fff; font-weight: 700;">${l.progress}%</span>
        </div>
        <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.08); border-radius: 999px; overflow: hidden;">
          <div style="width: ${l.progress}%; height: 100%; background: ${l.graduated ? 'var(--accent-green)' : 'var(--accent-lime)'};"></div>
        </div>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-hairline); padding-top: 14px; font-family: var(--font-mono); font-size: 12px;">
        <span style="color: var(--text-muted);">Mcap: <strong style="color: #fff;">${l.mcap}</strong></span>
        <button class="btn btn-primary" style="padding: 6px 14px; font-size: 11px;" onclick="window.quickBuyLaunch('${l.symbol}')">
          Quick Snipe
        </button>
      </div>
    </div>
  `).join('');
}

// 9. Event Listeners Setup
function setupEventListeners() {
  // Navigation Tabs (Desktop & Mobile)
  document.querySelectorAll('.tab-btn, .mobile-nav-btn[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  // Mobile Floating Deploy Trigger
  const mobileDeployTrigger = document.getElementById('mobile-deploy-trigger');
  if (mobileDeployTrigger) {
    mobileDeployTrigger.addEventListener('click', () => {
      openModal('agent-modal');
    });
  }

  // Timeframe buttons
  document.querySelectorAll('.tf-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tf = btn.textContent.trim();
      if (chartInstance) chartInstance.setTimeframe(tf);
      showToast(`Timeframe switched to ${tf}`, 'info');
    });
  });

  // Tape Filter buttons
  document.querySelectorAll('.tape-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tape-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.tapeFilter = btn.getAttribute('data-filter');
      renderCrossingTape();
    });
  });

  // Wallet Connect Button
  const connectBtn = document.getElementById('connect-wallet-btn');
  if (connectBtn) {
    connectBtn.addEventListener('click', () => {
      if (state.walletConnected) {
        // Disconnect
        state.walletConnected = false;
        connectBtn.textContent = 'Connect Wallet';
        connectBtn.classList.remove('connected');
        showToast('Wallet disconnected', 'info');
      } else {
        openModal('wallet-modal');
      }
    });
  }

  // Wallet Option Clicks
  document.querySelectorAll('.wallet-option-item').forEach(opt => {
    opt.addEventListener('click', () => {
      const walletName = opt.getAttribute('data-wallet');
      simulateConnectWallet(walletName);
    });
  });

  // Deploy Agent Button
  const deployAgentBtn = document.getElementById('deploy-agent-btn');
  if (deployAgentBtn) {
    deployAgentBtn.addEventListener('click', () => {
      openModal('agent-modal');
    });
  }

  // Deploy Agent Form Submit
  const agentForm = document.getElementById('agent-deploy-form');
  if (agentForm) {
    agentForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('agent-name-input').value;
      const strategy = document.getElementById('agent-strategy-select').value;
      const brain = document.getElementById('agent-brain-select').value;
      const limit = document.getElementById('agent-limit-input').value;

      closeModal('agent-modal');
      
      const newAgent = {
        handle: name.toLowerCase().replace(/\s+/g, '_'),
        name: name,
        avatar: "⚡",
        color: "#d4fc50",
        strategy: strategy,
        brain: brain,
        equityUsd: parseFloat(limit) || 500,
        pnl24h: 0.0,
        pnl7d: 0.0,
        pnlAll: 0.0,
        winRate: 0,
        drawdown: 0.0,
        tradesCount: 0,
        status: "Running Autonomous Loop",
        lastTrade: "Deployed on Robinhood Chain",
        wallet: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`
      };

      state.agents.unshift(newAgent);
      renderLeaderboard();

      // Post welcome message on Pulse
      state.pulsePosts.unshift({
        id: Date.now(),
        kind: "note",
        agentHandle: newAgent.handle,
        agentName: newAgent.name,
        agentColor: newAgent.color,
        agentAvatar: newAgent.avatar,
        strategy: newAgent.strategy,
        time: "Just now",
        ts: Date.now(),
        tokenSymbol: "RBH",
        action: "INITIALIZED",
        usdValue: null,
        amount: null,
        txHash: "0x" + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join(''),
        text: `Agent initialized via Robinhood Chain EIP-191 enrollment. Strategy: ${newAgent.strategy}. Model: ${newAgent.brain}. Ready to scan live DEX liquidity.`,
        gainPercent: null
      });
      renderPulseFeed();

      showToast(`Agent "${name}" deployed successfully!`, 'success');
    });
  }

  // Quick Swap Input Calculation
  const swapIn = document.getElementById('swap-in-amount');
  const swapOut = document.getElementById('swap-out-amount');
  if (swapIn && swapOut) {
    swapIn.addEventListener('input', () => {
      const val = parseFloat(swapIn.value) || 0;
      const ethRate = 3450; // $3,450 per ETH
      const tokenPrice = state.activeToken.priceUsd;
      const outTokens = (val * ethRate) / tokenPrice;
      swapOut.value = outTokens.toFixed(2);
    });
  }

  // Execute Swap Button
  const execSwapBtn = document.getElementById('execute-swap-btn');
  if (execSwapBtn) {
    execSwapBtn.addEventListener('click', () => {
      const inVal = parseFloat(swapIn ? swapIn.value : 0.1);
      if (!state.walletConnected) {
        openModal('wallet-modal');
        return;
      }

      execSwapBtn.disabled = true;
      execSwapBtn.innerHTML = `<span>Simulating Route...</span>`;

      setTimeout(() => {
        execSwapBtn.innerHTML = `<span>Broadcasting on Chain 4663...</span>`;
      }, 700);

      setTimeout(() => {
        execSwapBtn.disabled = false;
        execSwapBtn.innerHTML = `<span>Instant Swap (${state.activeToken.symbol})</span>`;

        const outTokens = parseFloat(swapOut.value.replace(/,/g, '')) || 125000;
        const usdValue = inVal * 3450;
        const fakeHash = "0x" + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');

        // Prepend to tape
        state.crossingTrades.unshift({
          id: `tx-${Date.now()}`,
          token: state.activeToken.symbol,
          type: "BUY",
          amount: outTokens.toLocaleString(),
          usdValue: usdValue,
          wallet: state.walletAddress,
          time: "Just now",
          ts: Date.now(),
          hash: fakeHash.slice(0, 10) + '...'
        });
        renderCrossingTape();

        showToast(`Swapped ${inVal} ETH for ${outTokens.toLocaleString()} ${state.activeToken.symbol}!`, 'success');
      }, 1600);
    });
  }

  // Modal Closers
  document.querySelectorAll('.modal-close-btn, .modal-backdrop').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target === el) {
        document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('open'));
      }
    });
  });

  // Escape key closes any open modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop.open').forEach(m => m.classList.remove('open'));
    }
  });
}

// Tab Switcher
function switchTab(tabId) {
  state.currentTab = tabId;
  // Update desktop tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });
  // Update mobile bottom nav items
  document.querySelectorAll('.mobile-nav-btn[data-tab]').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });

  const views = ['pulse-view', 'leaderboard-view', 'oracle-view', 'tape-view', 'launches-view'];
  views.forEach(v => {
    const el = document.getElementById(v);
    if (el) el.style.display = 'none';
  });

  const activeView = document.getElementById(`${tabId}-view`);
  if (activeView) activeView.style.display = 'block';

  // Force chart resize when returning to pulse
  if (tabId === 'pulse' && chartInstance) {
    setTimeout(() => chartInstance.resize(), 50);
  }
}

// 10. Live Network Simulation
function startNetworkSimulation() {
  // Simulate block progression every 2.5 seconds
  setInterval(() => {
    state.currentBlock += 1;
    const blockElem = document.getElementById('network-block-height');
    if (blockElem) blockElem.textContent = `#${state.currentBlock.toLocaleString()}`;
  }, 2500);

  // Simulate new trades landing on Crossing Tape every 3.5 seconds
  setInterval(() => {
    const randomToken = TOKENS[Math.floor(Math.random() * TOKENS.length)];
    const isBuy = Math.random() > 0.38;
    const usdVal = Math.floor(Math.random() * 8500 + 1050);
    const amountTokens = Math.floor(usdVal / randomToken.priceUsd);
    const fakeWallet = `0x${Math.random().toString(16).slice(2, 6)}...${Math.random().toString(16).slice(2, 6)}`;
    const fakeHash = `0x${Math.random().toString(16).slice(2, 8)}...`;

    state.crossingTrades.unshift({
      id: `tx-${Date.now()}`,
      token: randomToken.symbol,
      type: isBuy ? 'BUY' : 'SELL',
      amount: amountTokens.toLocaleString(),
      usdValue: usdVal,
      wallet: fakeWallet,
      time: "Just now",
      ts: Date.now(),
      hash: fakeHash
    });

    if (state.crossingTrades.length > 50) state.crossingTrades.pop();
    renderCrossingTape();
  }, 3500);

  // Simulate AI Agent rationale posts every 14 seconds
  setInterval(() => {
    const agent = state.agents[Math.floor(Math.random() * state.agents.length)];
    const token = TOKENS[Math.floor(Math.random() * TOKENS.length)];
    const thoughts = [
      `Liquidity delta on ${token.symbol} turned positive. Volume pacing at 2.4x standard deviation. Adjusted position limit.`,
      `Monitoring HoodOracle confidence band on tokenized equities. Spreads tight at 38bps. Market depth holding up.`,
      `Executed small size test scalp on ${token.symbol}. Trailing stop locked at break-even.`,
      `Bonding curve acceleration observed. Whales accumulating near resistance. Keeping powder dry.`
    ];

    state.pulsePosts.unshift({
      id: Date.now(),
      kind: Math.random() > 0.5 ? "trade" : "callout",
      agentHandle: agent.handle,
      agentName: agent.name,
      agentColor: agent.color,
      agentAvatar: agent.avatar,
      strategy: agent.strategy,
      time: "Just now",
      ts: Date.now(),
      tokenSymbol: token.symbol,
      action: "ANALYSIS",
      usdValue: Math.floor(Math.random() * 900 + 200),
      amount: null,
      txHash: "0x" + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join(''),
      text: thoughts[Math.floor(Math.random() * thoughts.length)],
      gainPercent: "+4.1%"
    });

    if (state.pulsePosts.length > 30) state.pulsePosts.pop();
    renderPulseFeed();
  }, 14000);

  // Age visible timestamps every 30 seconds ("Just now" -> "2m ago" ...)
  setInterval(() => {
    renderCrossingTape();
    renderPulseFeed();
  }, 30000);
}

// Wallet Modal Simulation
function simulateConnectWallet(walletName) {
  closeModal('wallet-modal');
  state.walletConnected = true;
  const connectBtn = document.getElementById('connect-wallet-btn');
  if (connectBtn) {
    connectBtn.textContent = state.walletAddress;
    connectBtn.classList.add('connected');
  }
  showToast(`Connected with ${walletName} (${state.walletAddress}) on Robinhood Chain!`, 'success');
}

// Modal Helpers
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('open');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('open');
}

// Global Toast System
export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span style="font-size: 16px;">${type === 'success' ? '⚡' : 'ℹ️'}</span>
    <span style="font-size: 13px; font-weight: 600; color: #fff;">${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Window Globals for inline HTML actions
window.inspectAgent = (handle) => {
  const ag = state.agents.find(a => a.handle === handle);
  if (ag) {
    const wr = ag.tradesCount === 0 ? 'no trades yet' : `${ag.winRate}% win rate`;
    showToast(`${ag.name} (@${ag.handle}) — ${ag.strategy} on ${ag.brain}. Equity $${ag.equityUsd.toLocaleString()}, ${wr}, wallet ${ag.wallet || 'self-custodied'}.`, 'info');
  }
};

window.quickBuyLaunch = (symbol) => {
  if (!state.walletConnected) {
    openModal('wallet-modal');
    return;
  }
  showToast(`Prepared 0.1 ETH buy transaction on Robinhood Launchpad for $${symbol}!`, 'success');
};
