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

        if ($request->filled('project_id')) $query->where('project_id', $request->project_id);
        if ($request->filled('type'))       $query->where('type', $request->type);

        return response()->json($query->get()->map(fn($d) => $this->format($d)));
    }

    public function store(Request $request)
    {
        $request->validate([
            'project_id' => 'required|exists:projects,id',
            'type'       => 'required|string|max:100',
            'file'       => 'required|file|max:20480',
        ]);

        $file     = $request->file('file');
        $path     = $file->store("documents/{$request->project_id}", 'public');
        $fileUrl  = Storage::disk('public')->url($path);
        $fileType = str_starts_with($file->getMimeType(), 'image/') ? 'image' : ($file->getMimeType() === 'application/pdf' ? 'pdf' : 'other');

        $doc = Document::create([
            'project_id'  => $request->project_id,
            'uploaded_by' => $request->user()->id,
            'type'        => $request->type,
            'name'        => $file->getClientOriginalName(),
            'file_path'   => $path,
            'file_url'    => $fileUrl,
            'file_size'   => $file->getSize(),
            'mime_type'   => $file->getMimeType(),
        ]);

        ActivityLogger::log($request->user(), 'Upload Dokumen', "Upload {$request->type}: {$doc->name}", $request->project_id);

        return response()->json($this->format($doc->load(['project:id,name', 'uploader:id,name'])), 201);
    }

    public function destroy(Request $request, Document $document)
    {
        Storage::disk('public')->delete($document->file_path);
        ActivityLogger::log($request->user(), 'Hapus Dokumen', "Hapus: {$document->name}", $document->project_id);
        $document->delete();
        return response()->json(['message' => 'Dokumen dihapus']);
    }

    private function format(Document $d): array
    {
        return [
            'id'         => $d->id,
            'name'       => $d->name,
            'type'       => $d->type,
            'uploader'   => $d->uploader?->name ?? '-',
            'date'       => $d->created_at?->format('d/m/Y'),
            'previewUrl' => $d->file_url,
            'fileType'   => str_starts_with($d->mime_type ?? '', 'image/') ? 'image' : ($d->mime_type === 'application/pdf' ? 'pdf' : 'other'),
            'projectId'  => $d->project_id,
            'project'    => $d->project?->name,
        ];
    }
}
