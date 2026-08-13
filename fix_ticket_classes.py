import sys

path = 'frontend/src/pages/Registration/TicketClasses.jsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. emptyTicketClass
content = content.replace('  benefits: \"\"\n};', '  benefits: \"\",\n  assignSeats: false\n};')

# 2. defaultClass
content = content.replace('          benefits: \"Event entry, registration confirmation, attendee access\",\n          active: true\n        });', '          benefits: \"Event entry, registration confirmation, attendee access\",\n          assignSeats: false,\n          active: true\n        });')

# 3. classes = [{...}]
content = content.replace('            benefits: \"Event entry, registration confirmation, attendee access\",\n            active: true\n          }\n        ];', '            benefits: \"Event entry, registration confirmation, attendee access\",\n            assignSeats: false,\n            active: true\n          }\n        ];')

# 4. editTicketClass
content = content.replace('      description: ticketClass.description,\n      benefits: ticketClass.benefits\n    });', '      description: ticketClass.description,\n      benefits: ticketClass.benefits,\n      assignSeats: ticketClass.assignSeats || false\n    });')

# 5. payload
content = content.replace('      benefits: form.benefits,\n      active: form.saleStatus !== \"Hidden\"\n    };', '      benefits: form.benefits,\n      assignSeats: form.assignSeats,\n      active: form.saleStatus !== \"Hidden\"\n    };')

# 6. UI
s = '''              <div className=\"col-12\">
                <label className=\"form-label fw-semibold\">Benefits (Optional)</label>
                <input
                  className=\"form-control\"
                  placeholder=\"e.g. Front row seating, priority access, merchandise\"
                  value={form.benefits}
                  onChange={(e) => updateField(\"benefits\", e.target.value)}
                />
                <small className=\"text-muted d-block mt-1\">
                  Comma separated list of benefits to show on the public event page.
                </small>
              </div>
            </div>'''
r = '''              <div className=\"col-12\">
                <label className=\"form-label fw-semibold\">Benefits (Optional)</label>
                <input
                  className=\"form-control\"
                  placeholder=\"e.g. Front row seating, priority access, merchandise\"
                  value={form.benefits}
                  onChange={(e) => updateField(\"benefits\", e.target.value)}
                />
                <small className=\"text-muted d-block mt-1\">
                  Comma separated list of benefits to show on the public event page.
                </small>
              </div>
              <div className=\"col-12\">
                <div className=\"form-check form-switch mt-2\">
                  <input
                    className=\"form-check-input\"
                    type=\"checkbox\"
                    id=\"assignSeatsSwitch\"
                    checked={form.assignSeats}
                    onChange={(e) => updateField(\"assignSeats\", e.target.checked)}
                  />
                  <label className=\"form-check-label fw-semibold\" htmlFor=\"assignSeatsSwitch\">
                    Assign Seats Sequentially (e.g., Gold-1, Gold-2)
                  </label>
                </div>
              </div>
            </div>'''
content = content.replace(s, r)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
