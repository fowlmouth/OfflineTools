import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { ImageEditor } from '../../src/pages/ImageEditor.jsx';

function makeCanvas(width = 50, height = 40) {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  return c;
}

const exportBlob = vi.fn();

const mockApi = {
  loadImage: vi.fn(),
  createCanvas: vi.fn(),
  drawImageTo: vi.fn(),
  flip: vi.fn(),
  rotate: vi.fn(),
  resize: vi.fn(),
  crop: vi.fn(),
  drawText: vi.fn(),
  applyFilters: vi.fn(),
  exportBlob,
  export: exportBlob,
  revokeObjectURL: vi.fn(),
  FORMATS: ['image/png', 'image/jpeg', 'image/webp'],
};

vi.mock('../../src/tools/image/index.js', () => ({ default: mockApi }));

function mockImageFile(name = 'pic.png', type = 'image/png') {
  return new File([new Uint8Array([1, 2, 3])], name, { type });
}

function resetMockDefaults() {
  vi.clearAllMocks();
  mockApi.loadImage.mockResolvedValue({
    image: { naturalWidth: 800, naturalHeight: 600, src: 'blob:test' },
    width: 800,
    height: 600,
    url: 'blob:test-url',
  });
  mockApi.createCanvas.mockImplementation((w, h) => makeCanvas(w ?? 10, h ?? 10));
  mockApi.drawImageTo.mockImplementation((target) => target);
  mockApi.flip.mockImplementation((canvas) => makeCanvas(canvas.width, canvas.height));
  mockApi.rotate.mockImplementation((canvas) => makeCanvas(canvas.width, canvas.height));
  mockApi.resize.mockImplementation(() => makeCanvas(20, 15));
  mockApi.crop.mockImplementation(() => makeCanvas(20, 15));
  mockApi.drawText.mockImplementation((canvas) => makeCanvas(canvas.width, canvas.height));
  mockApi.applyFilters.mockImplementation((canvas) => makeCanvas(canvas.width, canvas.height));
  mockApi.exportBlob.mockResolvedValue(new Blob(['x'], { type: 'image/png' }));
  mockApi.revokeObjectURL.mockImplementation(() => {});
}

async function uploadImage() {
  const input = await waitFor(() => screen.getByLabelText('Choose image'));
  fireEvent.change(input, { target: { files: [mockImageFile()] } });
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Reset' }).disabled).toBe(false),
  );
}

describe('ImageEditor', () => {
  beforeEach(() => {
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn().mockReturnValue('blob:download-url'),
      revokeObjectURL: vi.fn(),
    });
    resetMockDefaults();
  });

  it('renders the page title and description', () => {
    render(<ImageEditor />);
    expect(screen.getByText('Image Editor')).toBeDefined();
    expect(screen.getByText(/Edit images in your browser/)).toBeDefined();
  });

  it('renders a file input for uploading an image', async () => {
    render(<ImageEditor />);
    await waitFor(() => {
      expect(screen.getByLabelText('Choose image')).toBeDefined();
    });
  });

  it('renders a drag-and-drop zone', async () => {
    render(<ImageEditor />);
    await waitFor(() => {
      expect(screen.getByText(/drag and drop/i)).toBeDefined();
    });
  });

  it('renders the action buttons', async () => {
    render(<ImageEditor />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Flip Horizontal' })).toBeDefined();
      expect(screen.getByRole('button', { name: 'Flip Vertical' })).toBeDefined();
      expect(screen.getByRole('button', { name: 'Rotate Left' })).toBeDefined();
      expect(screen.getByRole('button', { name: 'Rotate Right' })).toBeDefined();
      expect(screen.getByRole('button', { name: 'Reset' })).toBeDefined();
      expect(screen.getByRole('button', { name: 'Download' })).toBeDefined();
    });
  });

  it('disables all action buttons before an image is loaded', async () => {
    render(<ImageEditor />);
    await waitFor(() => expect(screen.getByLabelText('Choose image')).toBeDefined());
    expect(screen.getByRole('button', { name: 'Flip Horizontal' }).disabled).toBe(true);
    expect(screen.getByRole('button', { name: 'Reset' }).disabled).toBe(true);
    expect(screen.getByRole('button', { name: 'Download' }).disabled).toBe(true);
  });

  it('loads the image when a file is chosen', async () => {
    render(<ImageEditor />);
    const input = await waitFor(() => screen.getByLabelText('Choose image'));
    fireEvent.change(input, { target: { files: [mockImageFile()] } });

    await waitFor(() => {
      expect(mockApi.loadImage).toHaveBeenCalledTimes(1);
    });
    expect(mockApi.loadImage).toHaveBeenCalledWith(expect.any(File));
  });

  it('renders a canvas preview after upload', async () => {
    const { container } = render(<ImageEditor />);
    await uploadImage();

    await waitFor(() => {
      expect(container.querySelector('.image-preview canvas')).toBeTruthy();
    });
  });

  it('enables the action buttons after upload', async () => {
    render(<ImageEditor />);
    await uploadImage();
    expect(screen.getByRole('button', { name: 'Flip Horizontal' }).disabled).toBe(false);
    expect(screen.getByRole('button', { name: 'Reset' }).disabled).toBe(false);
    expect(screen.getByRole('button', { name: 'Download' }).disabled).toBe(false);
  });

  it('shows an error message when loading fails', async () => {
    mockApi.loadImage.mockRejectedValueOnce(new Error('Bad file'));
    render(<ImageEditor />);
    fireEvent.change(await waitFor(() => screen.getByLabelText('Choose image')), {
      target: { files: [mockImageFile('bad.png')] },
    });
    await waitFor(() => {
      expect(screen.getByText(/Failed to load image/)).toBeDefined();
    });
  });

  it('delegates flip horizontal to the tool api', async () => {
    render(<ImageEditor />);
    await uploadImage();
    fireEvent.click(screen.getByRole('button', { name: 'Flip Horizontal' }));
    expect(mockApi.flip).toHaveBeenCalledWith(expect.any(HTMLCanvasElement), 'horizontal');
  });

  it('delegates flip vertical to the tool api', async () => {
    render(<ImageEditor />);
    await uploadImage();
    fireEvent.click(screen.getByRole('button', { name: 'Flip Vertical' }));
    expect(mockApi.flip).toHaveBeenCalledWith(expect.any(HTMLCanvasElement), 'vertical');
  });

  it('delegates rotate left to the tool api with -90 degrees', async () => {
    render(<ImageEditor />);
    await uploadImage();
    fireEvent.click(screen.getByRole('button', { name: 'Rotate Left' }));
    expect(mockApi.rotate).toHaveBeenCalledWith(expect.any(HTMLCanvasElement), -90);
  });

  it('delegates rotate right to the tool api with 90 degrees', async () => {
    render(<ImageEditor />);
    await uploadImage();
    fireEvent.click(screen.getByRole('button', { name: 'Rotate Right' }));
    expect(mockApi.rotate).toHaveBeenCalledWith(expect.any(HTMLCanvasElement), 90);
  });

  it('delegates resize to the tool api with width, height, and lock flag', async () => {
    render(<ImageEditor />);
    await uploadImage();

    fireEvent.input(screen.getByLabelText('Resize width'), { target: { value: '200' } });
    fireEvent.input(screen.getByLabelText('Resize height'), { target: { value: '100' } });
    fireEvent.click(screen.getByRole('button', { name: 'Resize' }));

    expect(mockApi.resize).toHaveBeenCalledWith(expect.any(HTMLCanvasElement), {
      width: 200,
      height: 100,
      lock: expect.any(Boolean),
    });
  });

  it('delegates crop to the tool api with the region', async () => {
    render(<ImageEditor />);
    await uploadImage();

    fireEvent.input(screen.getByLabelText('Crop X'), { target: { value: '10' } });
    fireEvent.input(screen.getByLabelText('Crop Y'), { target: { value: '20' } });
    fireEvent.input(screen.getByLabelText('Crop width'), { target: { value: '30' } });
    fireEvent.input(screen.getByLabelText('Crop height'), { target: { value: '40' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crop' }));

    expect(mockApi.crop).toHaveBeenCalledWith(expect.any(HTMLCanvasElement), {
      x: 10,
      y: 20,
      width: 30,
      height: 40,
    });
  });

  it('delegates add text to the tool api with text options', async () => {
    render(<ImageEditor />);
    await uploadImage();

    fireEvent.input(screen.getByLabelText('Text content'), { target: { value: 'Hello' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add Text' }));

    expect(mockApi.drawText).toHaveBeenCalledWith(
      expect.any(HTMLCanvasElement),
      expect.objectContaining({ text: 'Hello' }),
    );
  });

  it('delegates apply filters to the tool api', async () => {
    render(<ImageEditor />);
    await uploadImage();

    fireEvent.input(screen.getByLabelText('Brightness'), { target: { value: '1.2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply Filters' }));

    expect(mockApi.applyFilters).toHaveBeenCalledWith(
      expect.any(HTMLCanvasElement),
      expect.objectContaining({ brightness: 1.2 }),
    );
  });

  it('resets the working canvas back to the source image', async () => {
    render(<ImageEditor />);
    await uploadImage();
    const createCallsBefore = mockApi.createCanvas.mock.calls.length;
    const drawCallsBefore = mockApi.drawImageTo.mock.calls.length;

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

    expect(mockApi.createCanvas.mock.calls.length).toBeGreaterThan(createCallsBefore);
    expect(mockApi.drawImageTo.mock.calls.length).toBeGreaterThan(drawCallsBefore);
  });

  it('exports the canvas as a blob when Download is clicked', async () => {
    render(<ImageEditor />);
    await uploadImage();

    fireEvent.click(screen.getByRole('button', { name: 'Download' }));

    await waitFor(() => {
      expect(mockApi.exportBlob).toHaveBeenCalledWith(
        expect.any(HTMLCanvasElement),
        expect.objectContaining({ type: 'image/png' }),
      );
    });
  });

  it('respects the selected export format', async () => {
    render(<ImageEditor />);
    await uploadImage();

    fireEvent.change(screen.getByLabelText('Export format'), { target: { value: 'image/jpeg' } });
    fireEvent.click(screen.getByRole('button', { name: 'Download' }));

    await waitFor(() => {
      expect(mockApi.exportBlob).toHaveBeenCalledWith(
        expect.any(HTMLCanvasElement),
        expect.objectContaining({ type: 'image/jpeg' }),
      );
    });
  });

  it('lists the supported export formats', async () => {
    render(<ImageEditor />);
    await uploadImage();
    expect(screen.getByLabelText('Export format').length).toBe(mockApi.FORMATS.length);
  });

  it('loads an image via drag and drop', async () => {
    const { container } = render(<ImageEditor />);
    const zone = await waitFor(() => screen.getByText(/drag and drop/i).closest('.upload-zone'));

    fireEvent.drop(zone, {
      dataTransfer: { files: [mockImageFile('dropped.png')] },
    });

    await waitFor(() => {
      expect(mockApi.loadImage).toHaveBeenCalledWith(expect.any(File));
    });
    await waitFor(() => {
      expect(container.querySelector('.image-preview canvas')).toBeTruthy();
    });
  });
});
