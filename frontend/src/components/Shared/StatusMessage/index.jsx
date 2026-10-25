const StatusMessage = ({ title, children, tone = "neutral", action }) => {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className="mx-auto mt-16 max-w-xl rounded-[10px] border border-hairline bg-surface px-6 py-5"
    >
      <p
        className={`font-bold ${
          tone === "error" ? "text-[var(--status-critical)]" : ""
        }`}
      >
        {title}
      </p>
      {children && <p className="mt-1 text-sm text-ink-2">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

export default StatusMessage;
