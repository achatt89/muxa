class Muxa < Formula
  desc "Universal LLM proxy"
  homepage "https://github.com/your-org/muxa"
  license "Apache-2.0"
  depends_on "node@20"

  def install
    system "npm", "install", "-g", "muxa"
    bin.install_symlink Dir[HOMEBREW_PREFIX/"lib/node_modules/muxa/bin/*"], prefix/"bin"
  end

  def caveats
    <<~EOS
      After installation export your provider credentials, e.g.:
        export OPENAI_API_KEY=sk-your-key
        muxa --help
    EOS
  end
end
