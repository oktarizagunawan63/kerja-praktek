<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\Project;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
    public function index(Request $request)
    {
        $query = Document::with(['project:id,name', 'uploader:id,name'])
            ->orderByDesc('created_at');

        if ($request->filled('project_id')) {
            $query->where('project_id', $request->project_id);
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('search')) {
            $query->where('name', 'ilike', '%' . $request->search . '%');
        }

        return response()->json($query->paginate(20));
    }

    public function store(Request $request)
    {
        $request->validate([
            'project_id' => 'required|exists:projects,id',
            'type'       => 'required|in:daily_report,weekly_report,photo,technical_doc',
            'file'       => 'required|file|max:20480', // 20MB
        ]);

        $file = $request->file('file');
        $path = $file->store("documents/{$request->project_id}", 'public');

        $doc = Document::create([
            'project_id'  => $request->project_id,
            'uploaded_by' => $request->user()->id,
            'type'        => $request->type,
            'name'        => $file->getClientOriginalName(),
            'file_path'   => $path,
            'file_size'   => $file->getSize(),
            'mime_type'   => $file->getMimeType(),
        ]);

        ActivityLogger::log(
            $request->user(),
            'upload_document',
            "Upload dokumen: {$doc->name}",
        );

        return response()->json($doc->load(['project:id,name', 'uploader:id,name']), 201);
    }

    public function destroy(Request $request, Document $document)
    {
        Storage::disk('public')->delete($document->file_path);
        ActivityLogger::log($request->user(), 'delete_document', "Hapus dokumen: {$document->name}");
        $document->delete();
        return response()->json(['message' => 'Dokumen dihapus']);
    }
}
