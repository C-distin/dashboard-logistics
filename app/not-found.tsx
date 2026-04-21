import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="flex flex-col items-center text-center max-w-md gap-6">
        {/* SVG Illustration */}
        <svg
          width="280"
          height="200"
          viewBox="0 0 280 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Ocean / ground */}
          <ellipse
            cx="140"
            cy="178"
            rx="110"
            ry="12"
            fill="currentColor"
            className="text-muted/40"
          />

          {/* Shipping container body */}
          <rect
            x="60"
            y="100"
            width="160"
            height="70"
            rx="4"
            fill="currentColor"
            className="text-muted-foreground/15"
            stroke="currentColor"
            strokeWidth="1.5"
            style={{ stroke: "hsl(var(--border))" }}
          />

          {/* Container ridges */}
          {[80, 100, 120, 140, 160, 180, 200].map((x) => (
            <line
              key={x}
              x1={x}
              y1="100"
              x2={x}
              y2="170"
              stroke="currentColor"
              strokeWidth="1"
              className="text-border"
              opacity="0.5"
            />
          ))}

          {/* Container door lines */}
          <line
            x1="140"
            y1="100"
            x2="140"
            y2="170"
            stroke="currentColor"
            strokeWidth="1.5"
            style={{ stroke: "hsl(var(--border))" }}
          />
          <rect
            x="128"
            y="133"
            width="5"
            height="5"
            rx="1"
            fill="currentColor"
            className="text-muted-foreground/60"
          />
          <rect
            x="147"
            y="133"
            width="5"
            height="5"
            rx="1"
            fill="currentColor"
            className="text-muted-foreground/60"
          />

          {/* Question mark on container */}
          <text
            x="95"
            y="145"
            fontSize="28"
            fontWeight="700"
            fill="currentColor"
            className="text-muted-foreground/30"
            fontFamily="system-ui"
          >
            ?
          </text>

          {/* Crane arm */}
          <line
            x1="200"
            y1="20"
            x2="200"
            y2="100"
            stroke="currentColor"
            strokeWidth="3"
            className="text-foreground/20"
            strokeLinecap="round"
          />
          <line
            x1="180"
            y1="20"
            x2="230"
            y2="20"
            stroke="currentColor"
            strokeWidth="3"
            className="text-foreground/20"
            strokeLinecap="round"
          />
          <line
            x1="180"
            y1="20"
            x2="180"
            y2="50"
            stroke="currentColor"
            strokeWidth="3"
            className="text-foreground/20"
            strokeLinecap="round"
          />

          {/* Crane cable */}
          <line
            x1="200"
            y1="20"
            x2="140"
            y2="95"
            stroke="currentColor"
            strokeWidth="1"
            className="text-muted-foreground/40"
            strokeDasharray="4 3"
          />

          {/* Hook */}
          <path
            d="M136 95 Q136 103 140 103 Q144 103 144 95"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-muted-foreground/50"
            fill="none"
            strokeLinecap="round"
          />

          {/* 404 text large */}
          <text
            x="34"
            y="75"
            fontSize="52"
            fontWeight="800"
            fill="currentColor"
            className="text-foreground/10"
            fontFamily="system-ui"
            letterSpacing="-2"
          >
            404
          </text>

          {/* Small stars / lost dots */}
          <circle
            cx="48"
            cy="30"
            r="2"
            fill="currentColor"
            className="text-muted-foreground/40"
          />
          <circle
            cx="238"
            cy="55"
            r="1.5"
            fill="currentColor"
            className="text-muted-foreground/30"
          />
          <circle
            cx="22"
            cy="90"
            r="1"
            fill="currentColor"
            className="text-muted-foreground/20"
          />
          <circle
            cx="255"
            cy="88"
            r="2"
            fill="currentColor"
            className="text-muted-foreground/30"
          />
        </svg>

        {/* Text */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Page not found</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            This shipment seems to have gone off course. The page you're looking
            for doesn't exist or has been moved.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-medium h-9 px-4 hover:bg-primary/90 transition-colors"
          >
            Back to Dashboard
          </Link>
          <Link
            href="/dashboard/air-shipments"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background text-sm font-medium h-9 px-4 hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            View Shipments
          </Link>
        </div>
      </div>
    </div>
  );
}
