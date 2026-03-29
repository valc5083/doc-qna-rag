using DocQnA.API.DTOs;
using FluentValidation;

namespace DocQnA.API.Validators;

public class CreateCollectionRequestValidator
    : AbstractValidator<CreateCollectionRequest>
{
    public CreateCollectionRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Collection name is required.")
            .MinimumLength(2).WithMessage("Name must be at least 2 characters.")
            .MaximumLength(100).WithMessage("Name too long.");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description too long.");
    }
}