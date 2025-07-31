import "./App.css";
import { BulkImageUploaderChunking } from "./components/bulk-image-uploader-chunking";
import { BulkImageUploaderChunkingWithWorker } from "./components/bulk-image-uploader-chunking+worker";

function App() {
  return <BulkImageUploaderChunkingWithWorker />;
}

export default App;
