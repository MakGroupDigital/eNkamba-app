export type ComplianceDocumentKey =
  | 'identity'
  | 'businessRegistration'
  | 'taxDocument'
  | 'sellerContract'
  | 'customsDeclaration'
  | 'productTraceability';

export const COMPLIANCE_DOCUMENT_LABELS: Record<ComplianceDocumentKey, string> = {
  identity: 'Pièce d’identité',
  businessRegistration: 'Document entreprise',
  taxDocument: 'Document fiscal',
  sellerContract: 'Contrat vendeur',
  customsDeclaration: 'Déclaration douanière',
  productTraceability: 'Traçabilité produit',
};

export function getMarketplaceComplianceRequirements(input: {
  category?: string;
  roles?: string[];
  sellerVerified?: boolean;
}) {
  const roles = input.roles || [];
  const isProfessionalSeller = roles.length > 0;
  const customsRequired =
    input.category === 'B2B' ||
    roles.some((role) => ['supplier', 'wholesaler', 'producer', 'importer'].includes(role));
  const sellerVerificationStatus: 'verified' | 'pending' | 'unverified' =
    input.sellerVerified ? 'verified' : isProfessionalSeller ? 'pending' : 'unverified';

  const requiredDocuments: ComplianceDocumentKey[] = [
    'identity',
    ...(isProfessionalSeller ? (['businessRegistration', 'taxDocument', 'sellerContract'] as ComplianceDocumentKey[]) : []),
    ...(customsRequired ? (['customsDeclaration', 'productTraceability'] as ComplianceDocumentKey[]) : []),
  ];

  return {
    sellerVerified: Boolean(input.sellerVerified),
    sellerVerificationStatus,
    contractRequired: isProfessionalSeller,
    taxRequired: true,
    customsRequired,
    requiredDocuments,
    operationControls: ['invoice', 'stock', 'payment_trace', 'audit_log'],
  };
}
