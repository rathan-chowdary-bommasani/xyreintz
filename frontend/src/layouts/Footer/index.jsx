// Data provenance for the loaded month (meta.data from the API).
const Footer = (props) => {
  const { data } = props;

  return (
    <footer className="mx-auto max-w-[1180px] px-4 pb-10 text-xs text-muted sm:px-6">
      Source: Elexon Insights, FUELHH (wind outturn) and WINDFOR (wind
      forecast). National level, transmission connected wind. Times in UK
      local time. Data{" "}
      {data.source === "cache" ? "loaded from cache" : "fetched"}{" "}
      {new Date(data.fetched_at).toLocaleString("en-GB", {
        timeZone: "Europe/London",
      })}.
    </footer>
  );
};

export default Footer;
