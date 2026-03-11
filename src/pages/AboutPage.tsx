const AboutPage = () => {
  return (
    <div className="max-w-[700px] mx-auto px-6 py-20">
      <div className="text-center mb-16">
        <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-3">
          Nossa Essência
        </p>
        <h1 className="font-serif text-display text-foreground">
          Sobre a Sollaris
        </h1>
      </div>

      <div className="space-y-8 font-sans text-sm text-muted-foreground leading-[1.8]">
        <p>
          A Sollaris não é sobre acessibilidade — é sobre inteligência de compra.
          Vendemos beleza de verdade para mulheres que valorizam estética e exclusividade,
          sem o preço do ouro maciço.
        </p>

        <p>
          Cada peça existe em nosso portfólio porque foi escolhida sob um rigoroso
          olhar editorial. Curadoria, não varejo.
        </p>

        <div className="gold-line my-12" />

        <div className="text-center">
          <p className="font-sans text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-4">
            Nossa Promessa
          </p>
          <blockquote className="font-serif text-display-sm text-foreground">
            Refinamento que atravessa o tempo.
          </blockquote>
        </div>

        <div className="gold-line my-12" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-accent mb-2">
              Exclusivo
            </p>
            <p className="font-sans text-xs text-muted-foreground">
              Peças selecionadas com intenção e critério editorial rigoroso.
            </p>
          </div>
          <div>
            <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-accent mb-2">
              Atemporal
            </p>
            <p className="font-sans text-xs text-muted-foreground">
              Design que transcende tendências passageiras.
            </p>
          </div>
          <div>
            <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-accent mb-2">
              Premium
            </p>
            <p className="font-sans text-xs text-muted-foreground">
              Qualidade de alta joalheria em cada detalhe.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
