"use client";

export default function TestPage() {
  return (
    <div className="min-h-screen bg-base-200 p-8">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold text-primary mb-8">ทดสอบ DaisyUI</h1>
        
        {/* Test Buttons */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">ปุ่ม (Buttons)</h2>
          <div className="flex gap-4 flex-wrap">
            <button className="btn btn-primary">Primary</button>
            <button className="btn btn-secondary">Secondary</button>
            <button className="btn btn-accent">Accent</button>
            <button className="btn btn-success">Success</button>
            <button className="btn btn-warning">Warning</button>
            <button className="btn btn-error">Error</button>
            <button className="btn btn-outline">Outline</button>
            <button className="btn btn-ghost">Ghost</button>
          </div>
        </div>

        {/* Test Cards */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">การ์ด (Cards)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title">Card Title 1</h3>
                <p>This is a test card with base-100 background</p>
                <div className="card-actions justify-end">
                  <button className="btn btn-primary">Action</button>
                </div>
              </div>
            </div>
            
            <div className="card bg-primary text-primary-content shadow-xl">
              <div className="card-body">
                <h3 className="card-title">Card Title 2</h3>
                <p>This is a primary colored card</p>
                <div className="card-actions justify-end">
                  <button className="btn btn-secondary">Action</button>
                </div>
              </div>
            </div>
            
            <div className="card bg-secondary text-secondary-content shadow-xl">
              <div className="card-body">
                <h3 className="card-title">Card Title 3</h3>
                <p>This is a secondary colored card</p>
                <div className="card-actions justify-end">
                  <button className="btn btn-accent">Action</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Test Alerts */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">แจ้งเตือน (Alerts)</h2>
          <div className="space-y-4">
            <div className="alert alert-info">
              <span>This is an info alert</span>
            </div>
            <div className="alert alert-success">
              <span>This is a success alert</span>
            </div>
            <div className="alert alert-warning">
              <span>This is a warning alert</span>
            </div>
            <div className="alert alert-error">
              <span>This is an error alert</span>
            </div>
          </div>
        </div>

        {/* Test Stats */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">สถิติ (Stats)</h2>
          <div className="stats shadow bg-base-100">
            <div className="stat">
              <div className="stat-figure text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                </svg>
              </div>
              <div className="stat-title">Total Likes</div>
              <div className="stat-value text-primary">25.6K</div>
              <div className="stat-desc">21% more than last month</div>
            </div>

            <div className="stat">
              <div className="stat-figure text-secondary">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
              <div className="stat-title">Page Views</div>
              <div className="stat-value text-secondary">2.6M</div>
              <div className="stat-desc">21% more than last month</div>
            </div>

            <div className="stat">
              <div className="stat-figure text-accent">
                <div className="avatar online">
                  <div className="w-16 rounded-full">
                    <div className="bg-accent w-full h-full rounded-full flex items-center justify-center text-accent-content font-bold text-lg">
                      U
                    </div>
                  </div>
                </div>
              </div>
              <div className="stat-value">86%</div>
              <div className="stat-title">Tasks done</div>
              <div className="stat-desc text-accent">31 tasks remaining</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
