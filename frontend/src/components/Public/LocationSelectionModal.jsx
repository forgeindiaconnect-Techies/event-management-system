import React, { useState, useEffect } from "react";
import { BsSearch, BsCrosshair, BsX, BsBuildings } from "react-icons/bs";

const POPULAR_CITIES = [
  "Mumbai", "Delhi-NCR", "Bengaluru", "Hyderabad", 
  "Chandigarh", "Ahmedabad", "Pune", "Chennai", 
  "Kolkata", "Kochi"
];

export default function LocationSelectionModal({ 
  show, 
  onHide, 
  currentLocation, 
  onSelectLocation,
  onDetectLocation,
  locating,
  allCities = []
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewAll, setViewAll] = useState(false);

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
      setSearchQuery("");
      setViewAll(false);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [show]);

  if (!show) return null;

  const showAllOrSearch = viewAll || searchQuery.trim() !== "";

  let displayCities = [];
  if (showAllOrSearch) {
    const sortedAllCities = [...allCities].sort((a, b) => a.district.localeCompare(b.district));
    if (searchQuery.trim()) {
      displayCities = sortedAllCities.filter(c => 
        c.district.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.state.toLowerCase().includes(searchQuery.toLowerCase())
      );
    } else {
      displayCities = sortedAllCities;
    }
  } else {
    // Just popular cities for the grid
    displayCities = POPULAR_CITIES;
  }

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onHide}
    >
      <div 
        className="bg-white rounded-3 shadow-lg overflow-hidden d-flex flex-column"
        style={{
          width: '100%',
          maxWidth: '800px',
          maxHeight: '90vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="p-4 bg-white border-bottom position-relative flex-shrink-0">
          <button 
            onClick={onHide}
            className="btn btn-link text-dark position-absolute top-0 end-0 mt-3 me-3 p-1"
          >
            <BsX size={28} />
          </button>
          
          <div className="position-relative mt-2 mb-3">
            <BsSearch className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" size={18} />
            <input
              type="text"
              className="form-control form-control-lg border ps-5"
              placeholder="Search for your city"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ fontSize: "16px", borderRadius: "8px" }}
              autoFocus
            />
          </div>

          <button 
            className="btn btn-link text-danger text-decoration-none d-flex align-items-center gap-2 p-0"
            onClick={onDetectLocation}
            disabled={locating}
            style={{ fontWeight: "500", fontSize: "15px" }}
          >
            {locating ? <span className="spinner-border spinner-border-sm" /> : <BsCrosshair size={18} />}
            Detect my location
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 bg-white overflow-auto flex-grow-1" style={{ minHeight: "300px" }}>
          
          {!showAllOrSearch ? (
            <>
              <div className="text-center text-muted mb-4" style={{ fontSize: "14px" }}>Popular Cities</div>
              
              <div className="row g-4 justify-content-center">
                {displayCities.map((city) => (
                  <div key={city} className="col-4 col-sm-3 col-md-2 text-center" style={{ cursor: "pointer" }} onClick={() => onSelectLocation(city)}>
                    <div 
                      className="mx-auto mb-2 d-flex align-items-center justify-content-center border shadow-sm transition-all"
                      style={{ 
                        width: "60px", 
                        height: "60px", 
                        borderRadius: "50%",
                        backgroundColor: currentLocation === city ? "#fef2f2" : "#ffffff",
                        borderColor: currentLocation === city ? "#ef4444" : "#e2e8f0",
                        transition: "all 0.2s ease"
                      }}
                    >
                      <BsBuildings size={24} className={currentLocation === city ? "text-danger" : "text-muted"} />
                    </div>
                    <div 
                      className={currentLocation === city ? "text-danger fw-bold" : "text-dark"} 
                      style={{ fontSize: "13px" }}
                    >
                      {city}
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center mt-5">
                <button 
                  className="btn btn-link text-danger text-decoration-none fw-medium" 
                  style={{ fontSize: "14px" }}
                  onClick={() => setViewAll(true)}
                >
                  View All Cities
                </button>
              </div>
            </>
          ) : (
            <div className="all-cities-list">
              {searchQuery && displayCities.length === 0 && (
                <div className="text-center text-muted py-5">No cities found matching "{searchQuery}"</div>
              )}
              
              <div className="row">
                {displayCities.map((c, index) => (
                  <div key={`${c.district}-${c.state}-${index}`} className="col-12 col-sm-6 col-md-4 mb-3">
                    <div 
                      className="px-3 py-2 rounded-3"
                      style={{ 
                        cursor: "pointer", 
                        backgroundColor: currentLocation === c.district ? "#fef2f2" : "transparent",
                        transition: "background-color 0.2s"
                      }}
                      onClick={() => onSelectLocation(c.district)}
                      onMouseEnter={(e) => {
                        if (currentLocation !== c.district) e.currentTarget.style.backgroundColor = "#f8fafc";
                      }}
                      onMouseLeave={(e) => {
                        if (currentLocation !== c.district) e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <div className={currentLocation === c.district ? "text-danger fw-bold" : "text-dark fw-medium"} style={{ fontSize: "15px" }}>
                        {c.district}
                      </div>
                      <div className="text-muted" style={{ fontSize: "12px" }}>
                        {c.state}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
