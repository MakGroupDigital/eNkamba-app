import Image from "next/image";
import { AlertTriangle, Clock3, Headphones, ServerOff } from "lucide-react";

export function ServerMaintenancePage() {
  return (
    <main className="min-h-dvh bg-[#f7faf8] text-[#101815]">
      <section className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col justify-center px-5 py-8 sm:px-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[#dce8e1] bg-white shadow-sm">
            <Image
              src="/enkamba-logo.png"
              alt="eNkamba"
              width={34}
              height={34}
              priority
              className="h-8 w-8 object-contain"
            />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#32BB78]">
              eNkamba
            </p>
            <p className="text-sm text-[#647067]">Etat du service</p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-[#f1c7c7] bg-[#fff3f3] px-3 py-2 text-sm font-medium text-[#9f2323]">
              <ServerOff className="h-4 w-4" aria-hidden="true" />
              Serveur actuellement inaccessible
            </div>

            <h1 className="max-w-3xl text-4xl font-bold leading-tight text-[#101815] sm:text-5xl">
              Nous rencontrons un probleme avec le serveur.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-[#526059] sm:text-lg">
              L&apos;application eNkamba est temporairement indisponible pour
              des raisons de maintenance. Veuillez contacter le support client
              si vous avez besoin d&apos;assistance.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-[#dce8e1] bg-white p-4 shadow-sm">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-[#eaf8f1] text-[#23995f]">
                  <Clock3 className="h-5 w-5" aria-hidden="true" />
                </div>
                <h2 className="text-base font-semibold">Maintenance en cours</h2>
                <p className="mt-2 text-sm leading-6 text-[#647067]">
                  Nos equipes travaillent au retablissement de l&apos;acces au
                  service.
                </p>
              </div>

              <div className="rounded-lg border border-[#dce8e1] bg-white p-4 shadow-sm">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-[#fff7e8] text-[#b56b00]">
                  <Headphones className="h-5 w-5" aria-hidden="true" />
                </div>
                <h2 className="text-base font-semibold">Support client</h2>
                <p className="mt-2 text-sm leading-6 text-[#647067]">
                  Contactez le support eNkamba pour toute demande urgente ou
                  liee a votre compte.
                </p>
              </div>
            </div>
          </div>

          <aside className="rounded-lg border border-[#dce8e1] bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[#fff3f3] text-[#c03333]">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Details de l&apos;incident</h2>
                <p className="mt-2 text-sm leading-6 text-[#647067]">
                  Le serveur principal est actuellement inaccessible. Certaines
                  operations comme la connexion, les paiements, la messagerie et
                  le tableau de bord peuvent etre indisponibles.
                </p>
              </div>
            </div>

            <dl className="mt-6 space-y-4 text-sm">
              <div className="flex items-center justify-between gap-4 border-t border-[#edf2ef] pt-4">
                <dt className="text-[#647067]">Statut</dt>
                <dd className="font-semibold text-[#c03333]">Indisponible</dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-[#edf2ef] pt-4">
                <dt className="text-[#647067]">Cause</dt>
                <dd className="font-semibold text-[#101815]">Maintenance</dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-[#edf2ef] pt-4">
                <dt className="text-[#647067]">Action recommandee</dt>
                <dd className="text-right font-semibold text-[#101815]">
                  Contacter le support
                </dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>
    </main>
  );
}
