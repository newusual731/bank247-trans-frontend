import "./WelcomeDashboardPage.css";

const KPI = [
  { label: "Total Asset", value: "₦ 10,500", delta: "+ 10%", tone: "up" as const },
  { label: "Total Liability", value: "₦ 10,500", delta: "- 5%", tone: "down" as const },
  { label: "Net Profit & Loss", value: "₦ 10,500", delta: "+ 10%", tone: "up" as const },
  { label: "Pending", value: "180", delta: "+ 10%", tone: "warn" as const },
];

const BARS = [
  { day: "Mon", total: 19990, p1: 42, p2: 28, p3: 30 },
  { day: "Tue", total: 17250, p1: 38, p2: 32, p3: 30 },
  { day: "Wed", total: 20500, p1: 40, p2: 30, p3: 30 },
  { day: "Thu", total: 15800, p1: 35, p2: 35, p3: 30 },
  { day: "Fri", total: 22100, p1: 45, p2: 25, p3: 30 },
  { day: "Sat", total: 12400, p1: 33, p2: 34, p3: 33 },
  { day: "Sun", total: 8600, p1: 30, p2: 35, p3: 35 },
];

const TXNS = [
  { date: "April 20, 2025", code: "T001", amount: "₦ 10,500", account: "20001", status: "Failed" },
  { date: "April 20, 2025", code: "T002", amount: "₦ 10,500", account: "20001", status: "Posted" },
  { date: "April 20, 2025", code: "T003", amount: "₦ 10,500", account: "20004", status: "Failed" },
  { date: "April 20, 2025", code: "T004", amount: "₦ 10,500", account: "20001", status: "Posted" },
  { date: "April 20, 2025", code: "T005", amount: "₦ 10,500", account: "20001", status: "Pending" },
];

export function WelcomeDashboardPage() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="wdash">
      <header className="wdash-welcome">
        <h1>Welcome!</h1>
        <p>{greeting}</p>
      </header>

      <div className="wdash-kpis">
        {KPI.map((k) => (
          <article key={k.label} className={`wdash-kpi is-${k.tone}`}>
            <div className="wdash-kpi-top">
              <span className="wdash-kpi-icon" aria-hidden />
              <span className="wdash-kpi-delta">{k.delta}</span>
            </div>
            <h2>{k.label}</h2>
            <strong>{k.value}</strong>
            <svg className="wdash-spark" viewBox="0 0 120 36" aria-hidden>
              <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                points={k.tone === "down" ? "0,8 20,12 40,10 60,22 80,18 100,28 120,24" : "0,28 20,22 40,24 60,14 80,16 100,8 120,10"}
              />
            </svg>
          </article>
        ))}
      </div>

      <section className="wdash-chart-card">
        <div className="wdash-chart-head">
          <h3>Daily Journal Entry</h3>
          <select defaultValue="6 months">
            <option>6 months</option>
            <option>12 months</option>
          </select>
        </div>
        <div className="wdash-bars">
          {BARS.map((b) => (
            <div key={b.day} className="wdash-bar-col">
              <span className="wdash-bar-total">{b.total.toLocaleString()}</span>
              <div className="wdash-bar-stack">
                <i style={{ flex: b.p3 }} className="is-p3" />
                <i style={{ flex: b.p2 }} className="is-p2" />
                <i style={{ flex: b.p1 }} className="is-p1" />
              </div>
              <span>{b.day}</span>
            </div>
          ))}
        </div>
        <div className="wdash-chart-foot">
          <div>
            <strong>$20 678.89</strong>
            <em className="is-down">-1.5%</em>
          </div>
          <div className="wdash-legend">
            <label>
              <input type="checkbox" defaultChecked readOnly /> Product 1
            </label>
            <label>
              <input type="checkbox" defaultChecked readOnly /> Product 2
            </label>
            <label>
              <input type="checkbox" defaultChecked readOnly /> Product 3
            </label>
          </div>
        </div>
      </section>

      <section className="wdash-tx">
        <h3>Recent Transactions</h3>
        <div className="wdash-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Transaction Code</th>
                <th>Amount</th>
                <th>Account</th>
                <th>Status</th>
                <th>Sort</th>
              </tr>
            </thead>
            <tbody>
              {TXNS.map((r) => (
                <tr key={r.code}>
                  <td>{r.date}</td>
                  <td>{r.code}</td>
                  <td>{r.amount}</td>
                  <td>{r.account}</td>
                  <td>{r.status}</td>
                  <td>
                    <span className={`wdash-pill is-${r.status.toLowerCase()}`}>{r.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
