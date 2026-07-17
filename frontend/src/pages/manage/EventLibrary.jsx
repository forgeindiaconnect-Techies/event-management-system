import { useMemo, useState } from "react";
import {
  FaDownload,
  FaFileAlt,
  FaFileImage,
  FaFilePdf,
  FaFolderOpen,
  FaPlus,
  FaSearch,
  FaTrash,
  FaUpload
} from "react-icons/fa";

const emptyFile = {
  fileName: "",
  type: "Document",
  category: "General",
  access: "Team Only",
  uploadedBy: "Event Organizer",
  selectedFile: null,
  fileSize: "",
  notes: ""
};

function EventLibrary() {
  const [files, setFiles] = useState([]);
  const [form, setForm] = useState(emptyFile);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const filteredFiles = useMemo(() => {
    const query = search.toLowerCase();
    return files.filter((file) => {
      return (
        file.fileName.toLowerCase().includes(query) ||
        file.type.toLowerCase().includes(query) ||
        file.category.toLowerCase().includes(query)
      );
    });
  }, [files, search]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const detectFileType = (file) => {
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();

    if (fileType.includes("pdf") || fileName.endsWith(".pdf")) return "PDF";
    if (fileType.includes("image")) return "Image";
    if (fileType.includes("video")) return "Video";
    if (fileType.includes("presentation") || fileName.endsWith(".ppt") || fileName.endsWith(".pptx")) {
      return "Presentation";
    }
    if (fileType.includes("spreadsheet") || fileName.endsWith(".xls") || fileName.endsWith(".xlsx")) {
      return "Spreadsheet";
    }
    return "Document";
  };

  const formatFileSize = (size) => {
    if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileImport = (e) => {
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) return;

    setForm((current) => ({
      ...current,
      fileName: selectedFile.name,
      type: detectFileType(selectedFile),
      selectedFile,
      fileSize: formatFileSize(selectedFile.size)
    }));
    setMessage("");
  };

  const saveFile = (e) => {
    e.preventDefault();

    if (!form.selectedFile) {
      setMessage("Choose a file from your device.");
      return;
    }

    if (!form.fileName.trim()) {
      setMessage("File name is required.");
      return;
    }

    setFiles((current) => [
      {
        ...form,
        id: Date.now(),
        downloadUrl: URL.createObjectURL(form.selectedFile),
        uploadedAt: new Date().toLocaleString()
      },
      ...current
    ]);
    setForm(emptyFile);
    setShowForm(false);
    setMessage("File added to event library.");
  };

  const removeFile = (fileId) => {
    const removedFile = files.find((file) => file.id === fileId);

    if (removedFile?.downloadUrl) {
      URL.revokeObjectURL(removedFile.downloadUrl);
    }

    setFiles((current) => current.filter((file) => file.id !== fileId));
    setMessage("File removed from library.");
  };

  const closeForm = () => {
    setForm(emptyFile);
    setShowForm(false);
    setMessage("");
  };

  return (
    <div className="manage-subpage p-4">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h1 className="h3 fw-semibold mb-1">Event Library</h1>
          <p className="text-muted mb-0">
            Store event documents, images, banners, brochures and team resources.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary d-inline-flex align-items-center gap-2"
          onClick={() => setShowForm(true)}
        >
          <FaPlus /> Upload File
        </button>
      </div>

      {message && <div className="alert alert-info py-2">{message}</div>}

      {showForm && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-white py-3">
            <h2 className="h5 fw-semibold mb-1">Add Library File</h2>
            <p className="text-muted small mb-0">
              Import a file from your device and add it to this event library.
            </p>
          </div>

          <form className="card-body" onSubmit={saveFile}>
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label fw-semibold">Choose File *</label>
                <input
                  className="form-control"
                  type="file"
                  onChange={handleFileImport}
                />
                <div className="form-text">
                  Select a document, image, PDF, video, presentation or spreadsheet from your system or phone.
                </div>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">File Name *</label>
                <input
                  className="form-control"
                  value={form.fileName}
                  onChange={(e) => updateField("fileName", e.target.value)}
                  placeholder="Event Brochure.pdf"
                />
              </div>

              <div className="col-md-3">
                <label className="form-label fw-semibold">File Type</label>
                <select
                  className="form-select"
                  value={form.type}
                  onChange={(e) => updateField("type", e.target.value)}
                >
                  <option>Document</option>
                  <option>PDF</option>
                  <option>Image</option>
                  <option>Video</option>
                  <option>Presentation</option>
                  <option>Spreadsheet</option>
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label fw-semibold">Category</label>
                <select
                  className="form-select"
                  value={form.category}
                  onChange={(e) => updateField("category", e.target.value)}
                >
                  <option>General</option>
                  <option>Branding</option>
                  <option>Speaker</option>
                  <option>Sponsor</option>
                  <option>Ticket</option>
                  <option>Certificate</option>
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Access</label>
                <select
                  className="form-select"
                  value={form.access}
                  onChange={(e) => updateField("access", e.target.value)}
                >
                  <option>Team Only</option>
                  <option>Public</option>
                  <option>Speakers</option>
                  <option>Sponsors</option>
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Uploaded By</label>
                <input
                  className="form-control"
                  value={form.uploadedBy}
                  onChange={(e) => updateField("uploadedBy", e.target.value)}
                />
              </div>

              <div className="col-12">
                <label className="form-label fw-semibold">Notes</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={form.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  placeholder="Where this file is used or any internal notes"
                />
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button type="button" className="btn btn-light" onClick={closeForm}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary d-inline-flex align-items-center gap-2">
                <FaUpload /> Add File
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="row g-3 mb-4">
        <SummaryCard icon={<FaFolderOpen />} label="Files" value={files.length} />
        <SummaryCard
          icon={<FaFileImage />}
          label="Images"
          value={files.filter((file) => file.type === "Image").length}
        />
        <SummaryCard
          icon={<FaFilePdf />}
          label="PDFs"
          value={files.filter((file) => file.type === "PDF").length}
        />
        <SummaryCard
          icon={<FaFileAlt />}
          label="Public Files"
          value={files.filter((file) => file.access === "Public").length}
        />
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white py-3 d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <h2 className="h5 fw-semibold mb-1">Library Files</h2>
            <p className="text-muted small mb-0">Search and manage event assets.</p>
          </div>

          <div className="input-group" style={{ maxWidth: "320px" }}>
            <span className="input-group-text bg-white">
              <FaSearch />
            </span>
            <input
              className="form-control"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search files"
            />
          </div>
        </div>

        {filteredFiles.length === 0 ? (
          <div className="card-body text-center py-5">
            <FaFolderOpen className="text-secondary opacity-50 mb-3" size={52} />
            <h3 className="h5 fw-semibold">No files added yet</h3>
            <p className="text-muted">Upload brochures, logos, banners and event resources.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>File</th>
                  <th>Category</th>
                  <th>Access</th>
                  <th>Uploaded By</th>
                  <th>Uploaded</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((file) => (
                  <tr key={file.id}>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        <div className="library-file-icon">{getFileIcon(file.type)}</div>
                        <div>
                          <div className="fw-semibold">{file.fileName}</div>
                          <div className="text-muted small">
                            {file.type}{file.fileSize ? ` - ${file.fileSize}` : ""}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-primary-subtle text-primary">{file.category}</span>
                    </td>
                    <td>{file.access}</td>
                    <td>{file.uploadedBy}</td>
                    <td>{file.uploadedAt}</td>
                    <td className="text-end">
                      <a
                        className="btn btn-sm btn-light border me-2"
                        href={file.downloadUrl}
                        download={file.fileName}
                      >
                        <FaDownload />
                      </a>
                      <button
                        type="button"
                        className="btn btn-sm btn-light border"
                        onClick={() => removeFile(file.id)}
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{libraryStyles}</style>
    </div>
  );
}

function SummaryCard({ icon, label, value }) {
  return (
    <div className="col-sm-6 col-xl-3">
      <div className="card border-0 shadow-sm h-100">
        <div className="card-body d-flex align-items-center gap-3">
          <div className="library-summary-icon">{icon}</div>
          <div>
            <div className="text-muted small">{label}</div>
            <div className="fs-5 fw-semibold">{value}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getFileIcon(type) {
  if (type === "PDF") return <FaFilePdf />;
  if (type === "Image") return <FaFileImage />;
  return <FaFileAlt />;
}

const libraryStyles = `
  .library-summary-icon,
  .library-file-icon {
    align-items: center;
    background: #eef2ff;
    border-radius: 8px;
    color: #4f46e5;
    display: flex;
    height: 42px;
    justify-content: center;
    width: 42px;
  }
`;

export default EventLibrary;
