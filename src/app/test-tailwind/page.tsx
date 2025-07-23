export default function DaisyUITest() {
  return (
    <div className="min-h-screen bg-base-200 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">DaisyUI Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Card Title</h2>
              <p>If you can see this card with proper styling, DaisyUI is working!</p>
              <div className="card-actions justify-end">
                <button className="btn btn-primary">Action</button>
              </div>
            </div>
          </div>
          
          {/* Buttons */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Buttons</h2>
              <div className="space-y-2">
                <button className="btn btn-primary w-full">Primary</button>
                <button className="btn btn-secondary w-full">Secondary</button>
                <button className="btn btn-accent w-full">Accent</button>
                <button className="btn btn-success w-full">Success</button>
                <button className="btn btn-warning w-full">Warning</button>
                <button className="btn btn-error w-full">Error</button>
              </div>
            </div>
          </div>
          
          {/* Form Elements */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Form Elements</h2>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Input</span>
                </label>
                <input type="text" placeholder="Type here" className="input input-bordered" />
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Select</span>
                </label>
                <select className="select select-bordered">
                  <option>Option 1</option>
                  <option>Option 2</option>
                </select>
              </div>
              
              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">Checkbox</span>
                  <input type="checkbox" className="checkbox" />
                </label>
              </div>
            </div>
          </div>
          
          {/* Badges and Stats */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Badges & Stats</h2>
              <div className="flex flex-wrap gap-2 mb-4">
                <div className="badge badge-primary">Primary</div>
                <div className="badge badge-secondary">Secondary</div>
                <div className="badge badge-accent">Accent</div>
                <div className="badge badge-success">Success</div>
              </div>
              
              <div className="stats shadow">
                <div className="stat">
                  <div className="stat-title">Total</div>
                  <div className="stat-value">89,400</div>
                  <div className="stat-desc">↗︎ 400 (22%)</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Alert */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Alerts</h2>
              <div className="alert alert-info">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>DaisyUI Alert Component</span>
              </div>
              
              <div className="alert alert-success mt-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Success Alert!</span>
              </div>
            </div>
          </div>
          
          {/* Progress & Loading */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Progress & Loading</h2>
              <progress className="progress progress-primary w-full" value="70" max="100"></progress>
              <div className="flex justify-center mt-4">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <div className="alert alert-success max-w-md mx-auto">
            <span>✅ If all components above are styled correctly, both Tailwind CSS and DaisyUI are working perfectly!</span>
          </div>
        </div>
      </div>
    </div>
  );
}
