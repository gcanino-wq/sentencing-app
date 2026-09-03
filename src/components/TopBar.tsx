interface TopBarProps {
  back?: { label: string; onClick: () => void };
  forward?: { label: string; onClick: () => void };
}

/** The two crumbs that bracket every screen after the matter list. */
export function TopBar({ back, forward }: TopBarProps) {
  return (
    <div className="topbar">
      <button className="crumb" onClick={back?.onClick} disabled={!back}>
        {back ? '‹ ' + back.label : ''}
      </button>
      <button className="crumb" onClick={forward?.onClick} disabled={!forward}>
        {forward ? forward.label + ' ›' : ''}
      </button>
    </div>
  );
}
