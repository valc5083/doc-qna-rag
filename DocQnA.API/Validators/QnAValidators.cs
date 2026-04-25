using DocQnA.API.DTOs;
using FluentValidation;

namespace DocQnA.API.Validators;

public class AskRequestValidator : AbstractValidator<AskRequest>
{
    public AskRequestValidator()
    {
        RuleFor(x => x.Question)
            .NotEmpty().WithMessage("Question is required.")
            .MinimumLength(3).WithMessage("Question too short.")
            .MaximumLength(1000).WithMessage("Question too long.");

        RuleFor(x => x.DocumentId)
            .NotEmpty().WithMessage("DocumentId is required.");

        RuleFor(x => x.Language)
            .NotEmpty().WithMessage("Language is required.")
            .Must(lang => new[] { "en", "hi", "ta", "te", "bn", "mr", "bh" }
                .Contains((lang ?? string.Empty).Trim().ToLowerInvariant()))
            .WithMessage("Unsupported language. Allowed: en, hi, ta, te, bn, mr, bh.");
    }
}