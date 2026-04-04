using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using SixLabors.ImageSharp.Formats.Jpeg;
using UglyToad.PdfPig;

namespace DocQnA.API.Services;

public class ExtractedImage
{
    public int PageNumber { get; set; }
    public int ImageIndex { get; set; }
    public string Base64Data { get; set; } = string.Empty;
    public string MediaType { get; set; } = "image/jpeg";
    public int Width { get; set; }
    public int Height { get; set; }
}

public class ImageExtractorService
{
    private readonly ILogger<ImageExtractorService> _logger;
    private const int MaxImageBytes = 800_000;
    private const int MinDimension = 80;
    private const int MaxDimension = 1024;

    public ImageExtractorService(
        ILogger<ImageExtractorService> logger)
    {
        _logger = logger;
    }

    public List<ExtractedImage> ExtractImages(Stream pdfStream)
    {
        var images = new List<ExtractedImage>();

        try
        {
            using var pdf = PdfDocument.Open(pdfStream);
            int imageIndex = 0;

            foreach (var page in pdf.GetPages())
            {
                foreach (var pdfImage in page.GetImages())
                {
                    try
                    {
                        if (!pdfImage.TryGetPng(out var pngBytes)
                            || pngBytes == null
                            || pngBytes.Length == 0)
                            continue;

                        using var ms = new MemoryStream(pngBytes);
                        using var img = Image.Load(ms);

                        if (img.Width < MinDimension ||
                            img.Height < MinDimension)
                            continue;

                        var processed = ProcessImage(img);
                        if (processed.Length > MaxImageBytes)
                            continue;

                        images.Add(new ExtractedImage
                        {
                            PageNumber = page.Number,
                            ImageIndex = imageIndex++,
                            Base64Data =
                                Convert.ToBase64String(processed),
                            MediaType = "image/jpeg",
                            Width = img.Width,
                            Height = img.Height
                        });
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex,
                            "Failed to extract image from page {P}",
                            page.Number);
                    }
                }
            }

            _logger.LogInformation(
                "Extracted {Count} images from PDF",
                images.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Image extraction failed");
        }

        return images;
    }

    private static byte[] ProcessImage(Image img)
    {
        if (img.Width > MaxDimension ||
            img.Height > MaxDimension)
        {
            img.Mutate(x => x.Resize(new ResizeOptions
            {
                Size = new Size(MaxDimension, MaxDimension),
                Mode = ResizeMode.Max
            }));
        }

        using var output = new MemoryStream();
        img.Save(output, new JpegEncoder { Quality = 82 });
        return output.ToArray();
    }
}