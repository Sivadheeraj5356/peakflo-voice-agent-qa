(function (root) {
  const weights = {
    voice: 24,
    grounding: 28,
    handoff: 18,
    latency: 14,
    finance: 16
  };

  function parseScenario(text) {
    return String(text || '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, index) => {
        const [name = '', workflow = '', source = '', risk = 'medium'] = line.split('|').map((part) => part.trim());
        return { index: index + 1, name, workflow, source, risk: risk.toLowerCase() };
      })
      .filter((item) => item.name);
  }

  function hasExplicitVoiceDetails(text) {
    return /(amount|invoice|date|email|phone|reference|currency|payment link)/i.test(text);
  }

  function hasFinanceGuardrail(text) {
    return /(approval|limit|reconcil|audit|dispute|escalat|verify|confirm)/i.test(text);
  }

  function scoreScenario(item) {
    const combined = `${item.name} ${item.workflow} ${item.source}`;
    const grounded = Boolean(item.source) ? weights.grounding : 6;
    const voice = hasExplicitVoiceDetails(combined) ? weights.voice : 8;
    const finance = hasFinanceGuardrail(combined) ? weights.finance : 5;
    const riskPenalty = item.risk === 'high' ? 8 : item.risk === 'low' ? 0 : 4;
    const handoff = /handoff|human|agent|approval|escalat/i.test(combined) ? weights.handoff : 7;
    const latency = /cache|parallel|stream|budget|fast|latency/i.test(combined) ? weights.latency : 8;
    const score = Math.max(0, Math.min(100, grounded + voice + finance + handoff + latency - riskPenalty));
    return score;
  }

  function recommendation(item, score) {
    const gaps = [];
    if (!item.source) gaps.push('bind the flow to a finance system or knowledge source');
    if (!hasExplicitVoiceDetails(`${item.name} ${item.workflow}`)) gaps.push('spell out invoice, amount, date and contact details for TTS');
    if (!hasFinanceGuardrail(`${item.workflow} ${item.source}`)) gaps.push('add approval, verification or escalation rules');
    if (item.risk === 'high') gaps.push('route high-risk actions to human review');
    if (!gaps.length) return score >= 85 ? 'Ready for a controlled pilot with prompt-version tracking.' : 'Ready after a normal QA pass.';
    return `Fix before pilot: ${gaps.join('; ')}.`;
  }

  function evaluate(text) {
    return parseScenario(text)
      .map((item) => {
        const score = scoreScenario(item);
        return { ...item, score, recommendation: recommendation(item, score), status: score >= 75 ? 'pilot-ready' : 'needs work' };
      })
      .sort((a, b) => b.score - a.score);
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  }

  function render(items) {
    const output = document.querySelector('#results');
    if (!output) return;
    if (!items.length) {
      output.innerHTML = '<p class="empty-state">Add one scenario per line: name | workflow | grounding source | risk.</p>';
      return;
    }
    output.innerHTML = items.map((item) => `
      <article class="result-card">
        <div class="score-row"><h3>${escapeHtml(item.name)}</h3><span>${item.score}</span></div>
        <p class="status">${item.status} · ${escapeHtml(item.risk)} risk</p>
        <p>${escapeHtml(item.recommendation)}</p>
      </article>`).join('');
  }

  function boot() {
    const input = document.querySelector('#scenarioInput');
    const button = document.querySelector('#evaluateButton');
    if (!input || !button) return;
    button.addEventListener('click', () => render(evaluate(input.value)));
  }

  const api = { parseScenario, evaluate, scoreScenario };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root.document) root.PeakfloVoiceAgentQa = api;
  if (root.document) root.addEventListener('DOMContentLoaded', boot);
})(typeof window !== 'undefined' ? window : globalThis);
