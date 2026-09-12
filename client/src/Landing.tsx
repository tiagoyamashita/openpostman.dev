import "./landing.css";

const REPO_URL = "https://github.com/tiagoyamashita/openpostman.dev";
const APP_ROUTE = "#/app";

function GithubMark() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"
      />
    </svg>
  );
}

export default function Landing() {
  return (
    <div className="landing">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <nav className="landing-nav" aria-label="Primary">
        <a className="landing-logo" href="#/">
          <img src="/logo.png" alt="OpenPostman" width={36} height={36} />
          <span>OpenPostman</span>
        </a>
        <div className="landing-nav-links">
          <a href="#read">Read APIs</a>
          <a href="#test">Test APIs</a>
          <a href="#share">Share</a>
          <a href="#faq">FAQ</a>
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          <a className="btn btn-primary" href={APP_ROUTE}>
            Open the app
          </a>
        </div>
      </nav>

      <main id="main">

      <header className="landing-hero">
        <img
          className="landing-hero-logo"
          src="/logo.png"
          alt="OpenPostman logo, a Japanese red post box"
          width={240}
          height={240}
        />
        <p className="landing-eyebrow">
          Free &amp; open source <span className="landing-eyebrow-dot">·</span> openpostman.dev
        </p>
        <h1>
          Read and test your APIs
          <br />
          straight from the browser
        </h1>
        <p className="landing-lede">
          OpenPostman is a free, open-source API client. Import a spec to explore what an API
          offers, fire real requests at it, and keep the whole collection library in your own
          GitHub account — where your teammates can work from the exact same copy.
        </p>
        <div className="landing-cta">
          <a className="btn btn-primary btn-lg" href={APP_ROUTE}>
            Open the app
          </a>
          <a className="btn btn-github btn-lg" href="/auth/github">
            <GithubMark />
            Sign in with GitHub
          </a>
          <a className="btn btn-lg" href={REPO_URL} target="_blank" rel="noopener noreferrer">
            View the source
          </a>
        </div>
        <p className="landing-fineprint">
          No account required. As a guest, your collections stay in this browser&rsquo;s local
          storage — nothing is sent to a server you don&rsquo;t own.
        </p>
      </header>

      <section className="landing-section" id="read">
        <div className="landing-section-head">
          <h2>Read an API before you call it</h2>
          <p>
            Point OpenPostman at an OpenAPI 3.x or Swagger 2.0 document — paste it, upload the
            file, or load it from a URL. You get a collection named after the spec with one
            request per operation, pre-filled with the method, URL, and sample headers and body
            when the spec describes them.
          </p>
        </div>
        <ul className="landing-list">
          <li>Every path and operation laid out as a request you can run, not a page to scroll.</li>
          <li>Requests grouped per website, so several APIs can live side by side.</li>
          <li>Responses pretty-printed with status, timing, and size.</li>
        </ul>
      </section>

      <section className="landing-section" id="test">
        <div className="landing-section-head">
          <h2>Test it for real</h2>
          <p>
            Any HTTP method, custom headers, JSON or raw bodies. Requests go through a small proxy
            so CORS doesn&rsquo;t stand between you and the API you are debugging.
          </p>
        </div>
        <div className="landing-grid">
          <article className="landing-card">
            <h3>Environments</h3>
            <p>
              Keep base URLs, tokens, and IDs as variables, then switch environments to run the
              same collection against staging or production.
            </p>
          </article>
          <article className="landing-card">
            <h3>Extracts</h3>
            <p>
              Pull a value out of a response body or header into a variable, and the next request
              in the chain can use it — log in once, then call the endpoints that need the token.
            </p>
          </article>
          <article className="landing-card">
            <h3>Export anything</h3>
            <p>
              Download the full workspace, a single collection, or one request as JSON, and load
              it back on another machine.
            </p>
          </article>
        </div>
      </section>

      <section className="landing-section landing-share" id="share">
        <div className="landing-section-head">
          <h2>One library, shared over GitHub</h2>
          <p>
            Sign in with GitHub and your workspace is saved to a private Gist in your own account.
            There is no OpenPostman database — GitHub is the storage, so sharing a library is just
            sharing a Gist.
          </p>
        </div>
        <ol className="landing-steps">
          <li>
            <span className="landing-step-num">1</span>
            <div>
              <h3>Sign in with GitHub</h3>
              <p>
                OpenPostman asks for <code>read:user</code> and <code>gist</code> — nothing else,
                and no access to your repositories.
              </p>
            </div>
          </li>
          <li>
            <span className="landing-step-num">2</span>
            <div>
              <h3>Save your workspace</h3>
              <p>
                Projects, collections, requests, and environments are written to a single private
                Gist that you own and can revoke at any time.
              </p>
            </div>
          </li>
          <li>
            <span className="landing-step-num">3</span>
            <div>
              <h3>Share it with your team</h3>
              <p>
                Add collaborators to the Gist, or send them an exported JSON file. Everyone loads
                the same library and tests against the same requests.
              </p>
            </div>
          </li>
        </ol>
      </section>

      <section className="landing-section" id="faq">
        <div className="landing-section-head">
          <h2>FAQ</h2>
          <p>Short answers for people comparing API clients and wondering how OpenPostman stores data.</p>
        </div>
        <dl className="landing-faq">
          <div>
            <dt>Is OpenPostman free?</dt>
            <dd>
              Yes. OpenPostman is a free, Apache 2.0–licensed open-source project. There is no paid
              tier and no seat limit.
            </dd>
          </div>
          <div>
            <dt>Do I need an account to test APIs?</dt>
            <dd>
              No. You can read specs and send requests as a guest. Collections stay in this
              browser&rsquo;s local storage until you choose to sign in.
            </dd>
          </div>
          <div>
            <dt>How do I share an API collection with my team?</dt>
            <dd>
              Sign in with GitHub and OpenPostman saves the workspace to a private Gist you own.
              Share that Gist, or export JSON, so everyone tests the same library.
            </dd>
          </div>
          <div>
            <dt>Is OpenPostman a Postman alternative?</dt>
            <dd>
              OpenPostman is a free, open-source API client in the browser. Import OpenAPI 3.x or
              Swagger 2.0, send real HTTP requests, and keep collections on GitHub instead of a
              vendor database.
            </dd>
          </div>
        </dl>
      </section>

      <section className="landing-closing">
        <h2>Open source, all the way down</h2>
        <p>
          Apache 2.0 licensed, no paid tier, no seat count. Use the hosted app or run the React
          client and Express server yourself.
        </p>
        <div className="landing-cta">
          <a className="btn btn-primary btn-lg" href={APP_ROUTE}>
            Open the app
          </a>
          <a className="btn btn-lg" href={REPO_URL} target="_blank" rel="noopener noreferrer">
            Read the code
          </a>
        </div>
      </section>
      </main>

      <footer className="landing-footer">
        <span>OpenPostman — free, open-source API client</span>
        <div>
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          <a href={`${REPO_URL}/blob/main/LICENSE`} target="_blank" rel="noopener noreferrer">
            Apache 2.0
          </a>
        </div>
      </footer>
    </div>
  );
}
