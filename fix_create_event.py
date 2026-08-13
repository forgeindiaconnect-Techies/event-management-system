import sys

path = 'frontend/src/pages/CreateEvent.jsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1
content = content.replace('bannerUrl: \"\",\n  });', 'bannerUrl: \"\",\n    assignSeats: false,\n  });')

# 2
content = content.replace('ticketPrice: event.paid ? Number(event.ticketPrice) : 0,\n      });', 'ticketPrice: event.paid ? Number(event.ticketPrice) : 0,\n        assignSeats: event.assignSeats,\n      });')

# 3
s = '''                    <label className=\"form-check-label fw-semibold\">
                      Certificate Enabled
                    </label>
                  </div>
                </div>
              </div>'''
r = '''                    <label className=\"form-check-label fw-semibold\">
                      Certificate Enabled
                    </label>
                  </div>
                </div>

                <div className=\"col-md-6\">
                  <div className=\"form-check form-switch mb-3\">
                    <input
                      className=\"form-check-input\"
                      type=\"checkbox\"
                      name=\"assignSeats\"
                      checked={event.assignSeats}
                      onChange={handleChange}
                    />
                    <label className=\"form-check-label fw-semibold\">
                      Assign Seats Sequentially
                    </label>
                  </div>
                </div>
              </div>'''

content = content.replace(s, r)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
